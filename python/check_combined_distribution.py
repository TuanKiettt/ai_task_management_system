import json
from collections import Counter

# Load original MS-LaTTE data
with open("./mslatte_data/MS-LaTTE.json", "r", encoding="utf-8") as f:
    mslatte_data = json.load(f)

# Load synthetic data
with open("./synthetic_category_data.json", "r", encoding="utf-8") as f:
    synthetic_data = json.load(f)

print(f"Original MS-LaTTE samples: {len(mslatte_data)}")
print(f"Synthetic samples: {len(synthetic_data)}")

# Get labels from synthetic data
synthetic_labels = [item["label"] for item in synthetic_data]

# Count original distribution (from check_distribution.py logic)
from evaluate_models import map_category
category_counts = {}
for task in mslatte_data:
    list_title = task.get('ListTitle', '').lower()
    category = map_category(list_title)
    category_counts[category] = category_counts.get(category, 0) + 1

print("\nOriginal distribution:")
for cat, count in sorted(category_counts.items()):
    print(f"  {cat}: {count}")

print("\nSynthetic distribution:")
synthetic_counts = Counter(synthetic_labels)
for cat, count in sorted(synthetic_counts.items()):
    print(f"  {cat}: {count}")

# Combined distribution
combined_counts = category_counts.copy()
for cat, count in synthetic_counts.items():
    combined_counts[cat] = combined_counts.get(cat, 0) + count

print("\nCombined distribution:")
for cat, count in sorted(combined_counts.items()):
    print(f"  {cat}: {count}")

print(f"\nTotal combined samples: {sum(combined_counts.values())}")
