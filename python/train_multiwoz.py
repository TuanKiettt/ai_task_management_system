#!/usr/bin/env python3
"""
MultiWOZ + DistilBERT Training Script
Simple AI training with public datasets and models
"""

import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    Trainer, 
    TrainingArguments,
    DataCollatorWithPadding
)
from datasets import load_dataset
import numpy as np
from sklearn.metrics import accuracy_score, f1_score

def load_and_prepare_dataset():
    """Load MultiWOZ v22 dataset and prepare for training"""
    print("Loading MultiWOZ v22 dataset...")
    
    # Try MultiWOZ v22 first (the correct one)
    try:
        print("Trying MultiWOZ v22...")
        dataset = load_dataset("pfb30/multi_woz_v22")
        print(f"MultiWOZ v22 loaded successfully!")
        return adapt_multiwoz_dataset(dataset)
    except Exception as e:
        print(f"MultiWOZ v22 failed: {e}")
    
    # Fallback to other datasets
    datasets_to_try = [
        ("imdb", "IMDB Movie Reviews"),
        ("ag_news", "AG News"),
        ("squad", "SQuAD v1"),
        ("glue", "GLUE")
    ]
    
    for dataset_name, description in datasets_to_try:
        try:
            print(f"Trying {description}...")
            dataset = load_dataset(dataset_name)
            print(f"{description} loaded successfully!")
            return adapt_dataset_for_dialogue(dataset, dataset_name)
        except Exception as e:
            print(f"{description} failed: {e}")
            continue
    
    # If all fail, create dummy dataset
    print("All datasets failed, creating dummy dataset...")
    return create_dummy_dataset()

def adapt_multiwoz_dataset(dataset):
    """Adapt MultiWOZ v22 dataset for training"""
    print("Adapting MultiWOZ v22 for training...")
    
    # MultiWOZ v22 structure: dialogues with multiple turns
    train_data = []
    
    # Process training dialogues
    for i in range(min(1000, len(dataset['train']))):
        dialogue = dataset['train'][i]
        
        # Extract dialogue turns
        if 'dialogue' in dialogue:
            turns = dialogue['dialogue']
            for turn in turns:
                if isinstance(turn, dict) and 'text' in turn:
                    text = turn['text']
                    # Use dialogue act if available, otherwise use simple classification
                    label = turn.get('dialogue_act', i % 7)
                    
                    train_data.append({
                        'dialogue': text,
                        'dialogue_act': label,
                        'domains': dialogue.get('domains', ['general']),
                        'slots': turn.get('slots', {})
                    })
        elif isinstance(dialogue, dict) and 'text' in dialogue:
            # Simple format
            text = dialogue['text']
            label = dialogue.get('dialogue_act', i % 7)
            
            train_data.append({
                'dialogue': text,
                'dialogue_act': label,
                'domains': dialogue.get('domains', ['general']),
                'slots': dialogue.get('slots', {})
            })
    
    # Create dataset structure
    from datasets import Dataset, DatasetDict
    
    # Split into train/val/test
    split_idx = int(0.8 * len(train_data))
    val_idx = int(0.9 * len(train_data))
    
    dataset_dict = DatasetDict({
        'train': Dataset.from_list(train_data[:split_idx]),
        'validation': Dataset.from_list(train_data[split_idx:val_idx]),
        'test': Dataset.from_list(train_data[val_idx:])
    })
    
    print(f"MultiWOZ v22 adapted: {len(dataset_dict['train'])} training samples")
    return dataset_dict

def adapt_dataset_for_dialogue(dataset, dataset_name):
    """Adapt existing dataset for dialogue-like training"""
    print(f"Adapting {dataset_name} for dialogue training...")
    
    # Extract text from different dataset formats
    train_data = []
    
    if dataset_name == "imdb":
        # IMDB: text, label
        for i in range(min(1000, len(dataset['train']))):
            text = dataset['train'][i]['text']
            label = dataset['train'][i]['label']
            train_data.append({
                'dialogue': text,
                'dialogue_act': label,
                'domains': ['sentiment'],
                'slots': {}
            })
    
    elif dataset_name == "ag_news":
        # AG News: text, label
        for i in range(min(1000, len(dataset['train']))):
            text = dataset['train'][i]['text']
            label = dataset['train'][i]['label']
            train_data.append({
                'dialogue': text,
                'dialogue_act': label,
                'domains': ['news'],
                'slots': {}
            })
    
    elif dataset_name == "squad":
        # SQuAD: context, question, answers
        for i in range(min(1000, len(dataset['train']))):
            context = dataset['train'][i]['context']
            question = dataset['train'][i]['question']
            combined = f"Question: {question} Context: {context}"
            train_data.append({
                'dialogue': combined,
                'dialogue_act': 0,  # All as Q&A
                'domains': ['qa'],
                'slots': {}
            })
    
    else:
        # Generic fallback
        for i in range(min(100, len(dataset['train']))):
            # Get first text field
            item = dataset['train'][i]
            text = str(list(item.values())[0])
            train_data.append({
                'dialogue': text,
                'dialogue_act': i % 7,  # Cycle through 7 classes
                'domains': ['general'],
                'slots': {}
            })
    
    # Create dataset structure
    from datasets import Dataset, DatasetDict
    
    # Split into train/val/test
    split_idx = int(0.8 * len(train_data))
    val_idx = int(0.9 * len(train_data))
    
    dataset_dict = DatasetDict({
        'train': Dataset.from_list(train_data[:split_idx]),
        'validation': Dataset.from_list(train_data[split_idx:val_idx]),
        'test': Dataset.from_list(train_data[val_idx:])
    })
    
    print(f"Adapted dataset created: {len(dataset_dict['train'])} training samples")
    return dataset_dict

def create_dummy_dataset():
    """Create dummy dataset if all datasets fail"""
    print("Creating dummy dialogue dataset for demonstration...")
    
    # Sample dialogues for task management
    dialogues = [
        "I need to schedule a meeting for tomorrow at 2pm",
        "Can you book a restaurant for 4 people tonight?",
        "What time is the next train to London?",
        "I want to find a hotel near the city center",
        "Help me find a taxi to the airport",
        "Schedule a doctor appointment for next week",
        "Book a table at Italian restaurant for Friday",
        "What attractions are open on Sunday?",
        "I need train tickets to Manchester",
        "Find me a cheap hotel with free parking"
    ]
    
    # Create labels (dialogue acts)
    labels = [0, 1, 2, 3, 4, 5, 1, 6, 2, 3]  # Different dialogue types
    
    # Create dataset structure
    train_data = []
    for i, (dialogue, label) in enumerate(zip(dialogues, labels)):
        train_data.append({
            'dialogue': dialogue,
            'dialogue_act': label,
            'domains': ['task_management'],
            'slots': {}
        })
    
    # Convert to dataset format
    from datasets import Dataset, DatasetDict
    
    # Split into train/val/test
    split_idx = int(0.8 * len(train_data))
    val_idx = int(0.9 * len(train_data))
    
    dataset_dict = DatasetDict({
        'train': Dataset.from_list(train_data[:split_idx]),
        'validation': Dataset.from_list(train_data[split_idx:val_idx]),
        'test': Dataset.from_list(train_data[val_idx:])
    })
    
    print(f"Dummy dataset created: {len(dataset_dict['train'])} samples")
    return dataset_dict

def tokenize_dataset(dataset, tokenizer):
    """Tokenize the dataset for training"""
    print("Tokenizing dataset...")
    
    def tokenize_function(examples):
        # Handle different dataset formats
        if 'dialogue' in examples:
            text = examples['dialogue']
        elif 'text' in examples:
            text = examples['text']
        else:
            # Fallback to first string field
            text = [str(v) for v in list(examples.values())[0]]
        
        return tokenizer(
            text, 
            padding="max_length", 
            truncation=True, 
            max_length=128
        )
    
    # Apply tokenization
    tokenized_datasets = dataset.map(
        tokenize_function, 
        batched=True
    )
    
    # Add labels before removing columns
    if 'dialogue_act' in dataset['train'].column_names:
        # Add labels to tokenized dataset
        train_labels = dataset['train']['dialogue_act']
        val_labels = dataset['validation']['dialogue_act']
        test_labels = dataset['test']['dialogue_act']
        
        tokenized_datasets['train'] = tokenized_datasets['train'].add_column("label", train_labels)
        tokenized_datasets['validation'] = tokenized_datasets['validation'].add_column("label", val_labels)
        tokenized_datasets['test'] = tokenized_datasets['test'].add_column("label", test_labels)
    else:
        # Add dummy labels
        num_labels = 7  # Number of dialogue acts
        train_size = len(tokenized_datasets['train'])
        val_size = len(tokenized_datasets['validation'])
        test_size = len(tokenized_datasets['test'])
        
        tokenized_datasets['train'] = tokenized_datasets['train'].add_column(
            "label", 
            [i % num_labels for i in range(train_size)]
        )
        tokenized_datasets['validation'] = tokenized_datasets['validation'].add_column(
            "label",
            [i % num_labels for i in range(val_size)]
        )
        tokenized_datasets['test'] = tokenized_datasets['test'].add_column(
            "label",
            [i % num_labels for i in range(test_size)]
        )
    
    return tokenized_datasets

def compute_metrics(eval_pred):
    """Compute evaluation metrics"""
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    
    accuracy = accuracy_score(labels, predictions)
    f1 = f1_score(labels, predictions, average='weighted')
    
    return {
        'accuracy': accuracy,
        'f1': f1
    }

def train_model():
    """Main training function"""
    print("Starting MultiWOZ + DistilBERT Training")
    print("=" * 50)
    
    # Check GPU availability
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load dataset
    dataset = load_and_prepare_dataset()
    
    # Load tokenizer and model
    print("Loading DistilBERT model...")
    tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
    
    # Determine number of labels
    num_labels = 7  # MultiWOZ dialogue acts
    model = AutoModelForSequenceClassification.from_pretrained(
        "distilbert-base-uncased",
        num_labels=num_labels
    )
    
    # Move model to device
    model.to(device)
    
    # Tokenize dataset
    tokenized_datasets = tokenize_dataset(dataset, tokenizer)
    
    # Data collator
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir="./multiwoz_model",
        num_train_epochs=3,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        warmup_steps=100,
        weight_decay=0.01,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
    )
    
    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        eval_dataset=tokenized_datasets["validation"],
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )
    
    # Train the model
    print("Starting training...")
    trainer.train()
    
    # Evaluate the model
    print("Evaluating model...")
    eval_results = trainer.evaluate()
    print(f"Evaluation results: {eval_results}")
    
    # Save the model
    print("Saving model...")
    trainer.save_model("./multiwoz_model_final")
    tokenizer.save_pretrained("./multiwoz_model_final")
    
    # Test the model
    print("Testing model...")
    test_model(model, tokenizer, device)
    
    print("Training complete!")
    print("Model saved to: ./multiwoz_model_final")

def test_model(model, tokenizer, device):
    """Test the trained model with sample inputs"""
    
    # Test dialogues
    test_dialogues = [
        "I need to schedule a meeting for tomorrow",
        "Can you book a restaurant for tonight?",
        "What time is the next train?",
        "Find me a hotel near downtown"
    ]
    
    # Dialogue act labels (example)
    dialogue_acts = [
        "Schedule/Book",
        "Restaurant", 
        "Transportation",
        "Accommodation"
    ]
    
    model.eval()
    
    print("\nModel Predictions:")
    print("-" * 30)
    
    for dialogue in test_dialogues:
        # Tokenize input
        inputs = tokenizer(
            dialogue, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=128
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Get prediction
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = torch.argmax(predictions, dim=-1).item()
        
        # Get confidence
        confidence = predictions[0][predicted_class].item()
        
        # Print result
        label = dialogue_acts[predicted_class] if predicted_class < len(dialogue_acts) else f"Class {predicted_class}"
        print(f"Input: {dialogue}")
        print(f"Prediction: {label} (Confidence: {confidence:.2f})")
        print()

if __name__ == "__main__":
    try:
        train_model()
    except KeyboardInterrupt:
        print("\nTraining interrupted by user")
    except Exception as e:
        print(f"Error during training: {e}")
        print("Troubleshooting tips:")
        print("1. Install required packages: pip install transformers datasets torch")
        print("2. Check internet connection for dataset download")
        print("3. Ensure sufficient disk space for model storage")
