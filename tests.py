"""
Production-Grade Test Suite for the Prachaar.AI Backend Service.

This suite uses pytest, httpx, and pytest-mock to provide comprehensive testing
of the API endpoints, scoring logic, and edge cases.

To run tests:
1. Make sure you have the required dependencies:
   pip install pytest httpx pytest-mock Pillow "opencv-python-headless"
2. Run the command in your terminal:
   pytest -v
"""

import os
import shutil
import pytest
import numpy as np
from httpx import AsyncClient, ASGITransport
from PIL import Image

# Import the FastAPI app instance from the main backend file
# Note: The file must be in the same directory or accessible via PYTHONPATH.
from prachaar_ai_backend import app, settings

# --- Test Configuration ---
# Override settings to use dedicated test directories, ensuring isolation
TEST_UPLOADS_DIR = "./test_uploads"
TEST_DB_DIR = "./test_db"
settings.UPLOADS_PATH = TEST_UPLOADS_DIR
settings.DB_BASE_PATH = TEST_DB_DIR
settings.CHROMA_DB_PATH = os.path.join(TEST_DB_DIR, "chroma_db")
settings.SQLITE_DB_PATH = os.path.join(TEST_DB_DIR, "prachaar_ai.db")

# --- Fixtures ---

@pytest.fixture(scope="session", autouse=True)
def setup_and_teardown_test_environment():
    """
    (Session-scoped) Fixture to set up the test environment before any tests run
    and clean it up after all tests are done. Runs only once per test session.
    """
    # Teardown any previous unclean runs
    if os.path.exists(TEST_UPLOADS_DIR):
        shutil.rmtree(TEST_UPLOADS_DIR)
    if os.path.exists(TEST_DB_DIR):
        shutil.rmtree(TEST_DB_DIR)

    # Setup: Create fresh test directories
    os.makedirs(TEST_UPLOADS_DIR, exist_ok=True)
    os.makedirs(TEST_DB_DIR, exist_ok=True)
    
    yield  # This is where the test session will run

    # Teardown: Remove test directories after session is complete
    shutil.rmtree(TEST_UPLOADS_DIR, ignore_errors=True)
    shutil.rmtree(TEST_DB_DIR, ignore_errors=True)

@pytest.fixture
def test_image_path():
    """Creates a dummy PNG image file for testing uploads."""
    file_path = os.path.join(TEST_UPLOADS_DIR, "test_image.png")
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file_path, 'PNG')
    return file_path

@pytest.fixture
def test_gif_path():
    """Creates a dummy GIF file for testing uploads."""
    file_path = os.path.join(TEST_UPLOADS_DIR, "test_animation.gif")
    img1 = Image.new('RGB', (100, 100), color='blue')
    img2 = Image.new('RGB', (100, 100), color='green')
    img1.save(file_path, save_all=True, append_images=[img2], duration=100, loop=0)
    return file_path

@pytest.fixture(scope="module")
def anyio_backend():
    """Specify the async backend for pytest-asyncio to avoid warnings."""
    return "asyncio"

@pytest.fixture(scope="module")
async def async_client():
    """
    (Module-scoped) Provides an httpx AsyncClient for making requests to the test app.
    This client is reused across all tests in a module for efficiency.
    """
    # The fix is here: use ASGITransport to wrap the FastAPI app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

# --- Mocks ---

@pytest.fixture(autouse=True)
def mock_external_apis(mocker):
    """
    (Auto-used) Mocks all external network-bound calls (pytrends, imgflip, scraping)
    to ensure tests are fast, repeatable, and don't depend on external services.
    """
    mocker.patch(
        'prachaar_ai_backend.get_current_trends',
        return_value=["mocked trend 1", "mocked trend 2"]
    )
    mocker.patch(
        'prachaar_ai_backend.generate_trend_based_meme',
        return_value="https://i.imgflip.com/mocked_meme.jpg"
    )
    mocker.patch(
        'prachaar_ai_backend.scrape_content_from_url',
        return_value="This is some sample scraped content about digital marketing and advertising."
    )

# --- Test Cases ---

@pytest.mark.anyio
async def test_root_endpoint(async_client: AsyncClient):
    """Test the root endpoint to ensure the server is alive and responding."""
    response = await async_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Prachaar.AI API. Visit /docs for documentation."}

@pytest.mark.anyio
@pytest.mark.parametrize("file_fixture, filename, content_type", [
    ("test_image_path", "test.png", "image/png"),
    ("test_gif_path", "test.gif", "image/gif"),
])
async def test_publish_ad_success_with_various_file_types(
    async_client: AsyncClient, request, file_fixture, filename, content_type
):
    """
    Test successful ad publication using parameterized inputs for different media types (PNG, GIF).
    """
    file_path = request.getfixturevalue(file_fixture)
    url = "/advertiser/publish-ad/"
    form_data = {
        "ad_text": "Buy our new amazing product!",
        "landing_page_url": "https://example.com/product"
    }
    with open(file_path, "rb") as f:
        files = {"creative_file": (filename, f, content_type)}
        response = await async_client.post(url, data=form_data, files=files)

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["message"] == "Ad published and analyzed successfully."
    assert "ad_id" in data
    assert isinstance(data["ad_id"], str)
    assert "creative_score" in data and isinstance(data["creative_score"], float)
    assert "virality_score" in data and isinstance(data["virality_score"], float)
    assert data["generated_meme_url"] is not None

@pytest.mark.anyio
async def test_publish_ad_without_optional_text(async_client: AsyncClient, test_image_path: str):
    """Test that an ad can be published successfully without the optional `ad_text` field."""
    url = "/advertiser/publish-ad/"
    form_data = { "landing_page_url": "https://example.com/product" } # ad_text is omitted
    with open(test_image_path, "rb") as f:
        files = {"creative_file": ("image.png", f, "image/png")}
        response = await async_client.post(url, data=form_data, files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Ad published and analyzed successfully."
    # Virality score should default to 0.5 when no text is provided
    assert data["virality_score"] == 0.5

@pytest.mark.anyio
async def test_publish_ad_invalid_file_type(async_client: AsyncClient):
    """Test that publishing with an unsupported file type returns a 400 Bad Request error."""
    url = "/advertiser/publish-ad/"
    form_data = { "landing_page_url": "https://example.com" }
    # Use a dummy text file
    files = {"creative_file": ("test.txt", b"this is not an image", "text/plain")}
    response = await async_client.post(url, data=form_data, files=files)
        
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

@pytest.mark.anyio
async def test_publish_ad_internal_server_error(async_client: AsyncClient, test_image_path: str, mocker):
    """Test the server's error handling by mocking a failure during database storage."""
    # Mock the store_ad_in_databases function to raise an exception
    mocker.patch('prachaar_ai_backend.store_ad_in_databases', side_effect=Exception("Database connection failed"))
    
    url = "/advertiser/publish-ad/"
    form_data = {
        "ad_text": "This ad will fail",
        "landing_page_url": "https://example.com/fail"
    }
    with open(test_image_path, "rb") as f:
        files = {"creative_file": ("fail.png", f, "image/png")}
        response = await async_client.post(url, data=form_data, files=files)
    
    assert response.status_code == 500
    assert "internal error occurred during ad processing" in response.json()["detail"]

@pytest.mark.anyio
async def test_end_to_end_publish_then_fetch(async_client: AsyncClient, test_image_path: str):
    """
    Test the full integration loop: publish an ad, then fetch it with a matching context.
    This validates that data is correctly stored, indexed, and retrieved.
    """
    # 1. Publish an ad to ensure there's data to fetch
    publish_data = {
        "ad_text": "A great ad about digital marketing.",
        "landing_page_url": "https://example.com/marketing"
    }
    with open(test_image_path, "rb") as f:
        files = {"creative_file": ("test_ad.png", f, "image/png")}
        publish_response = await async_client.post("/advertiser/publish-ad/", data=publish_data, files=files)
    assert publish_response.status_code == 200
    published_ad = publish_response.json()

    # 2. Fetch an ad for a contextually similar URL, expecting to find the one we just published
    fetch_payload = {
        "content_url": "https://some-publisher.com/blog/about-advertising", # Mocked to return marketing content
        "num_ads": 1
    }
    fetch_response = await async_client.post("/publisher/fetch-ad/", json=fetch_payload)
    
    assert fetch_response.status_code == 200
    data = fetch_response.json()
    
    assert "matched_ads" in data
    assert len(data["matched_ads"]) == 1
    
    matched_ad = data["matched_ads"][0]
    assert matched_ad["ad_id"] == published_ad["ad_id"]
    assert matched_ad["ad_text"] == publish_data["ad_text"]
    assert matched_ad["landing_page_url"] == publish_data["landing_page_url"]
    assert matched_ad["creative_file_url"].endswith(".png")

@pytest.mark.anyio
async def test_fetch_ad_no_matches_for_unrelated_content(async_client: AsyncClient, test_image_path: str, mocker):
    """Test that fetching ads for unrelated content returns an empty list."""
    # 1. Publish a marketing ad
    publish_data = {"ad_text": "Digital marketing solutions", "landing_page_url": "https://example.com/marketing"}
    with open(test_image_path, "rb") as f:
        await async_client.post("/advertiser/publish-ad/", data=publish_data, files={"creative_file": ("ad.png", f, "image/png")})
    
    # 2. Mock the scraper to return completely different content
    mocker.patch('prachaar_ai_backend.scrape_content_from_url', return_value="A blog post about baking cakes and delicious recipes.")

    # 3. Fetch ad for the unrelated content
    fetch_payload = {
        "content_url": "https://unrelated-topic.com/cooking-recipes",
        "num_ads": 1
    }
    response = await async_client.post("/publisher/fetch-ad/", json=fetch_payload)
    
    assert response.status_code == 200
    assert response.json()["matched_ads"] == []

@pytest.mark.anyio
async def test_fetch_multiple_ads(async_client: AsyncClient, test_image_path: str):
    """Test requesting more than one ad from the publisher endpoint."""
    # Publish two distinct ads
    ad1_data = {"ad_text": "Ad about technology", "landing_page_url": "https://example.com/tech"}
    ad2_data = {"ad_text": "Another ad about tech and gadgets", "landing_page_url": "https://example.com/gadgets"}
    with open(test_image_path, "rb") as f:
        await async_client.post("/advertiser/publish-ad/", data=ad1_data, files={"creative_file": ("ad1.png", f, "image/png")})
    with open(test_image_path, "rb") as f:
        await async_client.post("/advertiser/publish-ad/", data=ad2_data, files={"creative_file": ("ad2.png", f, "image/png")})

    # Fetch 2 ads
    fetch_payload = {
        "content_url": "https://publisher.com/news/technology", # Mocked to return marketing/tech content
        "num_ads": 2
    }
    response = await async_client.post("/publisher/fetch-ad/", json=fetch_payload)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["matched_ads"]) == 2
    # Verify the ad IDs are unique
    ad_ids = {ad["ad_id"] for ad in data["matched_ads"]}
    assert len(ad_ids) == 2

