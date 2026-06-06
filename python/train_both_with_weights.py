"""
Train both category and priority models with class weights
"""
import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import numpy as np
from sklearn.utils.class_weight import compute_class_weight
from evaluate_models import adapt_mslatte_for_task_management, prepare_category_dataset, prepare_priority_dataset, CATEGORY_LABELS, PRIORITY_LABELS

# Use same category mapping as ai_server.py
CATEGORY_LABELS = {
    0: 'schedule_meeting',
    1: 'schedule_deadline', 
    2: 'schedule_appointment',
    3: 'book_resource',
    4: 'plan_activity',
    5: 'arrange_transport',
    6: 'handle_emergency'
}

PRIORITY_LABELS = {
    0: 'low',
    1: 'medium', 
    2: 'high',
    3: 'urgent'
}

# Load and prepare data
with open('./mslatte_data/MS-LaTTE.json', 'r') as f:
    data = json.load(f)

adapted_data, category_counter, priority_counter = adapt_mslatte_for_task_management(data)

print("Category distribution:")
for cat, count in sorted(category_counter.items()):
    print(f"  {CATEGORY_LABELS.get(cat, cat)}: {count}")

print("\nPriority distribution:")
for pri, count in sorted(priority_counter.items()):
    print(f"  {PRIORITY_LABELS.get(pri, pri)}: {count}")

# Prepare datasets
category_dataset, _ = prepare_category_dataset(adapted_data)
priority_dataset, _ = prepare_priority_dataset(adapted_data)

# Calculate class weights for category
category_labels = [item['label'] for item in category_dataset]
unique_classes = np.unique(category_labels)
num_classes = len(CATEGORY_LABELS)

category_class_weights = compute_class_weight(
    class_weight='balanced',
    classes=unique_classes,
    y=category_labels
)

# Create full weight tensor for all 7 classes
full_category_weights = np.ones(num_classes)
for i, cls in enumerate(unique_classes):
    full_category_weights[cls] = category_class_weights[i]

category_class_weights = torch.tensor(full_category_weights, dtype=torch.float)
print(f"\nCategory class weights: {category_class_weights}")

# Calculate class weights for priority
priority_labels = [item['label'] for item in priority_dataset]
unique_priority_classes = np.unique(priority_labels)
num_priority_classes = len(PRIORITY_LABELS)

priority_class_weights = compute_class_weight(
    class_weight='balanced',
    classes=unique_priority_classes,
    y=priority_labels
)

# Create full weight tensor for all 4 priority classes
full_priority_weights = np.ones(num_priority_classes)
for i, cls in enumerate(unique_priority_classes):
    full_priority_weights[cls] = priority_class_weights[i]

priority_class_weights = torch.tensor(full_priority_weights, dtype=torch.float)
print(f"Priority class weights: {priority_class_weights}")

# Custom Trainer with weighted loss
class WeightedTrainer(Trainer):
    def __init__(self, class_weights, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights
    
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        
        # Apply class weights to loss
        loss_fct = torch.nn.CrossEntropyLoss(weight=self.class_weights.to(model.device))
        loss = loss_fct(logits.view(-1, self.model.config.num_labels), labels.view(-1))
        
        return (loss, outputs) if return_outputs else loss

# ========== TRAIN CATEGORY MODEL ==========
print("\n" + "="*60)
print("TRAINING CATEGORY MODEL")
print("="*60)

category_train_test = category_dataset.train_test_split(test_size=0.2, seed=42)
category_train = category_train_test['train']
category_test = category_train_test['test']

category_tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')

def category_tokenize_function(examples):
    return category_tokenizer(
        examples['dialogue'],
        truncation=True,
        padding='max_length',
        max_length=128
    )

category_tokenized_train = category_train.map(category_tokenize_function, batched=True)
category_tokenized_train = category_tokenized_train.remove_columns(['dialogue'])
category_tokenized_train = category_tokenized_train.rename_column('label', 'labels')
category_tokenized_train.set_format('torch')

category_tokenized_test = category_test.map(category_tokenize_function, batched=True)
category_tokenized_test = category_tokenized_test.remove_columns(['dialogue'])
category_tokenized_test = category_tokenized_test.rename_column('label', 'labels')
category_tokenized_test.set_format('torch')

category_model = AutoModelForSequenceClassification.from_pretrained(
    'distilbert-base-uncased',
    num_labels=len(CATEGORY_LABELS)
)

category_training_args = TrainingArguments(
    output_dir='./models/task_category_model_weighted',
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    warmup_steps=100,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=50,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    learning_rate=3e-5,
    gradient_accumulation_steps=2,
    report_to="none"
)

category_trainer = WeightedTrainer(
    class_weights=category_class_weights,
    model=category_model,
    args=category_training_args,
    train_dataset=category_tokenized_train,
    eval_dataset=category_tokenized_test
)

print("Starting category model training with class weights...")
category_trainer.train()
category_trainer.save_model('./models/task_category_model_weighted')
category_tokenizer.save_pretrained('./models/task_category_model_weighted')
print("Category model saved!")

# ========== TRAIN PRIORITY MODEL ==========
print("\n" + "="*60)
print("TRAINING PRIORITY MODEL")
print("="*60)

priority_train_test = priority_dataset.train_test_split(test_size=0.2, seed=42)
priority_train = priority_train_test['train']
priority_test = priority_train_test['test']

priority_tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')

def priority_tokenize_function(examples):
    return priority_tokenizer(
        examples['dialogue'],
        truncation=True,
        padding='max_length',
        max_length=128
    )

priority_tokenized_train = priority_train.map(priority_tokenize_function, batched=True)
priority_tokenized_train = priority_tokenized_train.remove_columns(['dialogue'])
priority_tokenized_train = priority_tokenized_train.rename_column('label', 'labels')
priority_tokenized_train.set_format('torch')

priority_tokenized_test = priority_test.map(priority_tokenize_function, batched=True)
priority_tokenized_test = priority_tokenized_test.remove_columns(['dialogue'])
priority_tokenized_test = priority_tokenized_test.rename_column('label', 'labels')
priority_tokenized_test.set_format('torch')

priority_model = AutoModelForSequenceClassification.from_pretrained(
    'distilbert-base-uncased',
    num_labels=len(PRIORITY_LABELS)
)

priority_training_args = TrainingArguments(
    output_dir='./models/task_priority_model_weighted',
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    warmup_steps=100,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=50,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    learning_rate=3e-5,
    gradient_accumulation_steps=2,
    report_to="none"
)

priority_trainer = WeightedTrainer(
    class_weights=priority_class_weights,
    model=priority_model,
    args=priority_training_args,
    train_dataset=priority_tokenized_train,
    eval_dataset=priority_tokenized_test
)

print("Starting priority model training with class weights...")
priority_trainer.train()
priority_trainer.save_model('./models/task_priority_model_weighted')
priority_tokenizer.save_pretrained('./models/task_priority_model_weighted')
print("Priority model saved!")

print("\n" + "="*60)
print("TRAINING COMPLETE")
print("="*60)
print("Both models saved with class weights!")
