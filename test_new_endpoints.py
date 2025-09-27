#!/usr/bin/env python3
"""
Test script for the new ad spot identification endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_health_check():
    """Test if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"✅ Health Check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_identify_ad_spots():
    """Test the identify-ad-spots endpoint"""
    print("\n🔍 Testing identify-ad-spots endpoint...")
    
    # Test with a sample news website (BBC News)
    test_url = "https://www.bbc.com"
    
    try:
        payload = {"url": test_url}
        response = requests.post(
            f"{BASE_URL}/identify-ad-spots",
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {data['total_spots_identified']} ad spots")
            print(f"Processing time: {data['processing_time']}s")
            
            # Show first few ad spots
            for i, spot in enumerate(data['identified_ad_spots'][:3]):
                print(f"  Spot {i+1}: {spot['element_type']} - {spot['position']} - {spot['size_estimate']}")
                
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing identify-ad-spots: {e}")
        return False

def test_process_url():
    """Test the process-url endpoint"""
    print("\n🔄 Testing process-url endpoint...")
    
    # Test with a simple HTML page that likely has ads
    test_url = "https://www.example.com"  # Simple page to avoid overwhelming output
    
    try:
        payload = {"url": test_url}
        response = requests.post(
            f"{BASE_URL}/process-url",
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Processed URL with {data['total_spots_identified']} ad spots")
            print(f"Processing time: {data['processing_time']}s")
            print(f"HTML length: {len(data['processed_html'])} characters")
            
            # Show identified ad spots
            for i, spot in enumerate(data['identified_ad_spots']):
                print(f"  Spot {i+1}: {spot['element_type']} ({spot['position']}, {spot['size_estimate']})")
                
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing process-url: {e}")
        return False

def test_with_ad_heavy_site():
    """Test with a site likely to have many ads"""
    print("\n📰 Testing with ad-heavy site...")
    
    # Test with a news site that typically has ads
    test_url = "https://techcrunch.com"
    
    try:
        payload = {"url": test_url}
        response = requests.post(
            f"{BASE_URL}/identify-ad-spots",
            json=payload,
            timeout=45  # Longer timeout for complex sites
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {data['total_spots_identified']} ad spots on {test_url}")
            print(f"Processing time: {data['processing_time']}s")
            
            # Group by position and size
            positions = {}
            sizes = {}
            
            for spot in data['identified_ad_spots']:
                pos = spot['position']
                size = spot['size_estimate']
                positions[pos] = positions.get(pos, 0) + 1
                sizes[size] = sizes.get(size, 0) + 1
            
            print("📊 Ad spots by position:")
            for pos, count in positions.items():
                print(f"  {pos}: {count}")
                
            print("📐 Ad spots by size:")
            for size, count in sizes.items():
                print(f"  {size}: {count}")
                
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing with ad-heavy site: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing New Ad Spot Identification Endpoints")
    print("=" * 50)
    
    # First check if server is running
    if not test_health_check():
        print("❌ Server is not running. Please start the server first.")
        return
    
    print("🟢 Server is running!")
    
    # Wait for models to load
    print("\n⏳ Waiting for models to load...")
    time.sleep(3)
    
    # Run tests
    tests = [
        test_identify_ad_spots,
        test_process_url,
        test_with_ad_heavy_site
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
            time.sleep(2)  # Brief pause between tests
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    passed = sum(results)
    total = len(results)
    print(f"✅ Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The new endpoints are working correctly.")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
