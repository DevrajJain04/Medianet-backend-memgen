"""
Example prompts and usage for the AI Meme Generator

This file contains example prompts that work well with the meme generator.
You can use these as inspiration for your own memes!
"""

EXAMPLE_PROMPTS = [
    # Programming/Tech Memes
    {
        "text": "When your code works on the first try",
        "expected_style": "surprised/skeptical",
        "good_templates": ["Surprised Pikachu", "Drake Hotline Bling"]
    },
    {
        "text": "Debugging code at 3 AM and finding the bug was a missing semicolon",
        "expected_style": "frustrated/relieved",
        "good_templates": ["Hide the Pain Harold", "This Is Fine"]
    },
    {
        "text": "When someone asks if you tested your code in production",
        "expected_style": "nervous/guilty",
        "good_templates": ["Monkey Puppet", "Sweating Bullets"]
    },
    
    # Work/Life Memes
    {
        "text": "Monday morning meetings be like",
        "expected_style": "tired/reluctant",
        "good_templates": ["Tired Cat", "Disaster Girl"]
    },
    {
        "text": "When you realize it's only Tuesday",
        "expected_style": "disappointed",
        "good_templates": ["Disappointed Black Guy", "Sad Pablo Escobar"]
    },
    {
        "text": "Me pretending to work from home",
        "expected_style": "sneaky/guilty",
        "good_templates": ["Evil Kermit", "Drake Hotline Bling"]
    },
    
    # Student Life
    {
        "text": "When the teacher says the test will be easy",
        "expected_style": "skeptical",
        "good_templates": ["Suspicious Fry", "Third World Skeptical Kid"]
    },
    {
        "text": "Studying one hour before the exam",
        "expected_style": "panic/desperate",
        "good_templates": ["This Is Fine", "Panik Kalm Panik"]
    },
    
    # Internet Culture
    {
        "text": "When someone doesn't get your meme reference",
        "expected_style": "disappointed",
        "good_templates": ["They Don't Know", "Ancient Aliens"]
    },
    {
        "text": "Explaining memes to people over 40",
        "expected_style": "patient/explaining",
        "good_templates": ["Charlie Conspiracy", "Pepe Silvia"]
    },
    
    # Food/Lifestyle
    {
        "text": "When you order food delivery at 2 AM",
        "expected_style": "no-shame",
        "good_templates": ["Shrug", "This Is Fine"]
    },
    {
        "text": "Seeing the gym membership charge on your credit card",
        "expected_style": "guilty/regretful",
        "good_templates": ["Monkey Puppet", "Hide the Pain Harold"]
    },
    
    # Relationships
    {
        "text": "When your friend asks if you're okay but you're definitely not okay",
        "expected_style": "lying/pretending",
        "good_templates": ["This Is Fine", "Hide the Pain Harold"]
    },
    {
        "text": "Me trying to adult",
        "expected_style": "struggling/confused",
        "good_templates": ["Confused Math Lady", "Is This A Pigeon"]
    }
]

PROMPT_WRITING_TIPS = [
    "Keep prompts relatable - think about common experiences",
    "Use current slang and internet language appropriately", 
    "Reference popular culture, but keep it accessible",
    "Emotional contexts work well - frustration, excitement, confusion",
    "Situation-based prompts are very effective",
    "Don't be too specific - let the AI add the humor",
    "Think about the visual - what facial expression fits?",
    "Trending topics and current events can be goldmines",
    "Self-deprecating humor often works well",
    "Universal experiences (work, school, relationships) are safe bets"
]

TEMPLATE_SUGGESTIONS = {
    "reaction": ["Surprised Pikachu", "Hide the Pain Harold", "Monkey Puppet"],
    "choice": ["Drake Hotline Bling", "Two Buttons", "Left Exit 12 Off Ramp"],
    "explanation": ["Charlie Conspiracy", "Ancient Aliens", "Change My Mind"],
    "progression": ["Expanding Brain", "Gru's Plan", "Buff Doge vs. Cheems"],
    "comparison": ["They're The Same Picture", "Is This A Pigeon", "Two Paths"],
    "panic": ["This Is Fine", "Panik Kalm Panik", "Stressed Out"],
    "success": ["Success Kid", "Leonardo DiCaprio Cheers", "Epic Handshake"],
    "failure": ["Disaster Girl", "Sad Pablo Escobar", "Crying Cat"]
}

def get_random_prompt():
    """Get a random example prompt"""
    import random
    return random.choice(EXAMPLE_PROMPTS)

def get_prompts_by_category(category):
    """Get prompts that work well for a specific emotion/situation"""
    if category in TEMPLATE_SUGGESTIONS:
        return [p for p in EXAMPLE_PROMPTS 
                if any(template in p.get("good_templates", []) 
                      for template in TEMPLATE_SUGGESTIONS[category])]
    return []

if __name__ == "__main__":
    print("🎭 AI Meme Generator - Example Prompts")
    print("=" * 50)
    
    print("\n📝 Writing Tips:")
    for i, tip in enumerate(PROMPT_WRITING_TIPS, 1):
        print(f"{i:2}. {tip}")
    
    print("\n🎯 Example Prompts:")
    for i, example in enumerate(EXAMPLE_PROMPTS[:10], 1):
        print(f"\n{i:2}. \"{example['text']}\"")
        print(f"    Style: {example['expected_style']}")
        print(f"    Good templates: {', '.join(example['good_templates'])}")
    
    print(f"\n... and {len(EXAMPLE_PROMPTS) - 10} more examples!")
    
    print("\n🎲 Random Prompt:")
    random_prompt = get_random_prompt()
    print(f"   \"{random_prompt['text']}\"")
    
    print("\n💡 Try these prompts with the meme generator!")
    print("   python main.py")
    print("   Then use the web interface or API endpoints")
