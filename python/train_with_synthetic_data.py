import json
import torch
from datasets import Dataset
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification, TrainingArguments, Trainer
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from collections import Counter
from evaluate_models import adapt_mslatte_for_task_management, prepare_category_dataset
from pathlib import Path

# Load existing MS-LaTTE data
with open("./mslatte_data/MS-LaTTE.json", "r", encoding="utf-8") as f:
    mslatte_data = json.load(f)

print(f"Loaded {len(mslatte_data)} MS-LaTTE samples")

# Adapt MS-LaTTE data for task management
adapted_data, _, _ = adapt_mslatte_for_task_management(mslatte_data)
category_dataset, _ = prepare_category_dataset(adapted_data)

print(f"Adapted {len(category_dataset)} samples for category classification")

# Load synthetic data
with open("./synthetic_category_data.json", "r", encoding="utf-8") as f:
    synthetic_data = json.load(f)

print(f"Loaded {len(synthetic_data)} synthetic samples")

# Convert synthetic data to match category_dataset format
synthetic_texts = [item["text"] for item in synthetic_data]
synthetic_labels = [item["label"] for item in synthetic_data]

synthetic_dataset = Dataset.from_dict({"text": synthetic_texts, "label": synthetic_labels})

# Combine datasets
combined_texts = list(category_dataset["dialogue"]) + synthetic_texts
combined_labels = list(category_dataset["label"]) + synthetic_labels

print(f"Combined dataset: {len(category_dataset)} existing + {len(synthetic_dataset)} synthetic = {len(combined_texts)} total")

# Check label distribution
label_counts = Counter(combined_labels)
print(f"Label distribution: {label_counts}")

# Split into train and test (80-20)
from sklearn.model_selection import train_test_split
train_texts, test_texts, train_labels, test_labels = train_test_split(
    combined_texts, combined_labels, test_size=0.2, random_state=42, stratify=combined_labels
)

print(f"Train samples: {len(train_texts)}, Test samples: {len(test_texts)}")

# Tokenize
tokenizer = DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

train_dataset = Dataset.from_dict({"text": train_texts, "label": train_labels})
test_dataset = Dataset.from_dict({"text": test_texts, "label": test_labels})

train_dataset = train_dataset.map(tokenize_function, batched=True)
test_dataset = test_dataset.map(tokenize_function, batched=True)

# Calculate class weights
label_counts_train = Counter(train_labels)
total_samples = len(train_labels)
num_classes = 7

class_weights = []
for i in range(num_classes):
    count = label_counts_train.get(i, 0)
    if count > 0:
        weight = total_samples / (num_classes * count)
    else:
        weight = 1.0
    class_weights.append(weight)

class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32)
print(f"Class weights: {class_weights_tensor}")

# Load model - start from scratch to avoid file locking
print("Starting from scratch")
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=7)

# Define custom loss function with class weights
class WeightedLossTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.get("logits")
        
        # Move class weights to same device as model
        class_weights = class_weights_tensor.to(logits.device)
        
        loss_fct = torch.nn.CrossEntropyLoss(weight=class_weights)
        loss = loss_fct(logits.view(-1, self.model.config.num_labels), labels.view(-1))
        
        return (loss, outputs) if return_outputs else loss

# Metrics
def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    
    accuracy = accuracy_score(labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, predictions, average='weighted')
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

# Training arguments
training_args = TrainingArguments(
    output_dir='./models/task_category_model_synthetic_v2',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=100,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    report_to="none"
)

# Initialize trainer
trainer = WeightedLossTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    compute_metrics=compute_metrics
)

# Train
print("Starting training with synthetic data...")
trainer.train()

# Evaluate
print("Evaluating model...")
eval_results = trainer.evaluate()
print(f"Evaluation results: {eval_results}")

# Save model
trainer.save_model()
tokenizer.save_pretrained('./models/task_category_model_synthetic_v2')
print("Model saved to ./models/task_category_model_synthetic_v2")

# Save evaluation results
with open("./evaluation_results_synthetic.json", "w") as f:
    json.dump(eval_results, f, indent=2)
print("Evaluation results saved to ./evaluation_results_synthetic.json")
