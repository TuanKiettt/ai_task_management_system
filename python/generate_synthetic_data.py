import json
import random
from typing import List, Dict

# Category mapping from MS-LaTTE
CATEGORY_MAPPING = {
    "Personal": 0,
    "Administrative": 1,
    "Health": 2,
    "Meeting": 3,
    "General": 4,
    "Academic": 5,
    "Activity": 6
}

# Templates for each category
TEMPLATES = {
    "Personal": [
        "Buy groceries for the week",
        "Pay electricity bill by Friday",
        "Schedule dentist appointment",
        "Renew gym membership",
        "Call mom about birthday party",
        "Buy birthday gift for Sarah",
        "Schedule haircut appointment",
        "Pay credit card bill",
        "Buy new shoes for work",
        "Schedule car maintenance",
        "Buy groceries from supermarket",
        "Pay internet bill",
        "Schedule doctor appointment",
        "Buy medicine from pharmacy",
        "Call insurance company",
        "Renew passport",
        "Buy winter clothes",
        "Schedule eye exam",
        "Pay rent",
        "Buy furniture for living room"
    ],
    "Health": [
        "Go for morning run",
        "Schedule annual health checkup",
        "Take vitamins daily",
        "Drink 8 glasses of water",
        "Go to yoga class",
        "Schedule vaccination appointment",
        "Buy health supplements",
        "Go to physical therapy",
        "Schedule mental health consultation",
        "Buy healthy groceries",
        "Go for evening walk",
        "Schedule dental cleaning",
        "Buy fitness equipment",
        "Go swimming",
        "Schedule massage therapy",
        "Buy organic food",
        "Go to gym workout",
        "Schedule nutrition consultation",
        "Buy yoga mat",
        "Go for bike ride"
    ],
    "Meeting": [
        "Schedule team meeting for project review",
        "Arrange client presentation",
        "Organize quarterly planning meeting",
        "Schedule one-on-one with manager",
        "Arrange stakeholder meeting",
        "Schedule sprint planning",
        "Organize team standup",
        "Arrange budget review meeting",
        "Schedule performance review",
        "Organize department meeting",
        "Schedule client kickoff meeting",
        "Arrange training session",
        "Schedule board meeting",
        "Organize workshop",
        "Schedule strategy meeting",
        "Arrange partner meeting",
        "Schedule retrospective",
        "Organize all-hands meeting",
        "Schedule interview",
        "Arrange demo meeting"
    ],
    "Academic": [
        "Submit research paper by deadline",
        "Complete literature review",
        "Prepare for thesis defense",
        "Attend lecture on machine learning",
        "Submit assignment by Friday",
        "Study for final exam",
        "Complete lab report",
        "Attend seminar on data science",
        "Submit thesis draft",
        "Prepare presentation for class",
        "Complete online course module",
        "Attend professor office hours",
        "Submit group project",
        "Study for midterm exam",
        "Complete homework assignment",
        "Attend workshop on research methods",
        "Submit conference paper",
        "Prepare for quiz",
        "Complete reading assignment",
        "Attend tutoring session"
    ],
    "Activity": [
        "Go hiking this weekend",
        "Plan camping trip",
        "Schedule tennis match",
        "Go to movie theater",
        "Plan birthday party",
        "Go to concert",
        "Schedule game night",
        "Go to beach",
        "Plan road trip",
        "Go to museum",
        "Schedule bowling night",
        "Go to amusement park",
        "Plan dinner party",
        "Go to art gallery",
        "Schedule karaoke night",
        "Go to festival",
        "Plan weekend getaway",
        "Go to sports event",
        "Schedule picnic",
        "Go to zoo"
    ]
}

# Variations to add diversity
TIME_VARIATIONS = [
    "by tomorrow",
    "by Friday",
    "by next week",
    "by end of day",
    "by Monday",
    "by next month",
    "this afternoon",
    "this evening",
    "tomorrow morning",
    "next week Monday"
]

PEOPLE_VARIATIONS = [
    "with John",
    "with Sarah",
    "with Maria",
    "with the team",
    "with colleagues",
    "with friends",
    "with family",
    "with the manager",
    "with the client",
    "with the professor"
]

def generate_synthetic_samples(category: str, num_samples: int) -> List[Dict]:
    """Generate synthetic samples for a given category."""
    templates = TEMPLATES.get(category, [])
    samples = []
    
    for i in range(num_samples):
        template = random.choice(templates)
        
        # Add variations
        if random.random() > 0.5:
            template += " " + random.choice(TIME_VARIATIONS)
        if random.random() > 0.7:
            template += " " + random.choice(PEOPLE_VARIATIONS)
        
        sample = {
            "text": template,
            "label": CATEGORY_MAPPING[category],
            "label_text": category
        }
        samples.append(sample)
    
    return samples

def generate_all_synthetic_data(samples_per_category: int = 100) -> List[Dict]:
    """Generate synthetic data for all minority categories."""
    all_samples = []
    
    # Generate for minority categories (excluding Administrative and General which are majority)
    minority_categories = ["Personal", "Health", "Meeting", "Academic", "Activity"]
    
    for category in minority_categories:
        samples = generate_synthetic_samples(category, samples_per_category)
        all_samples.extend(samples)
        print(f"Generated {len(samples)} samples for {category}")
    
    return all_samples

def save_synthetic_data(samples: List[Dict], output_file: str):
    """Save synthetic data to JSON file."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(samples, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(samples)} synthetic samples to {output_file}")

def load_existing_data(data_file: str) -> List[Dict]:
    """Load existing MS-LaTTE data."""
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} existing samples from {data_file}")
    return data

def combine_data(existing_data: List[Dict], synthetic_data: List[Dict]) -> List[Dict]:
    """Combine existing and synthetic data."""
    combined = existing_data + synthetic_data
    print(f"Combined dataset: {len(existing_data)} existing + {len(synthetic_data)} synthetic = {len(combined)} total")
    return combined

if __name__ == "__main__":
    # Generate synthetic data
    synthetic_samples = generate_all_synthetic_data(samples_per_category=200)
    
    # Save synthetic data
    save_synthetic_data(synthetic_samples, "./synthetic_category_data.json")
    
    print("\nSynthetic data generation complete!")
    print(f"Total synthetic samples: {len(synthetic_samples)}")
