"""
Evaluation script for trained task classification models
Evaluates category and priority classification models on test set
Generates metrics, confusion matrix, and sample predictions
"""

import os
import json
import time
import psutil
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from datasets import Dataset
import torch

# Configuration
CATEGORY_MODEL_PATH = './models/task_category_model_synthetic_v2'
PRIORITY_MODEL_PATH = './models/task_priority_model_final'
DATASET_PATH = './mslatte_data/MS-LaTTE.json'
OUTPUT_DIR = './evaluation_results'

# Category labels
CATEGORY_LABELS = {
    0: 'Personal',
    1: 'Administrative',
    2: 'Health',
    3: 'Meeting',
    4: 'General',
    5: 'Academic',
    6: 'Activity'
}

# Priority labels
PRIORITY_LABELS = {
    0: 'Urgent',
    1: 'High',
    2: 'Medium',
    3: 'Low'
}

def load_mslatte_dataset(dataset_path):
    """Load MS-LaTTE dataset from JSON file"""
    print(f"Loading dataset from: {dataset_path}")
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")
    
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} tasks from MS-LaTTE dataset")
    return data

def adapt_mslatte_for_task_management(data):
    """Adapt MS-LaTTE dataset for task management classification"""
    print("Adapting MS-LaTTE dataset for task management...")
    
    # Debug: Print first task to understand structure
    if len(data) > 0:
        print(f"First task structure: {data[0]}")
    
    adapted_data = []
    category_counter = {}
    priority_counter = {}
    
    for task in data:
        # Extract task text - MS-LaTTE uses 'TaskTitle'
        task_text = task.get('TaskTitle', '') or task.get('task', '') or task.get('title', '') or task.get('text', '') or task.get('description', '')
        if not task_text:
            continue
        
        # Extract list_title for category mapping - MS-LaTTE uses 'ListTitle'
        list_title = task.get('ListTitle', '') or task.get('list_title', '') or task.get('category', '') or task.get('list', '') or ''
        list_title = str(list_title).lower()
        
        # Map category using list_title
        category = map_category(list_title)
        
        # Infer priority from task content
        priority = infer_priority(task_text)
        
        adapted_data.append({
            'text': task_text,
            'category': category,
            'priority': priority
        })
        
        # Count categories
        category_counter[category] = category_counter.get(category, 0) + 1
        priority_counter[priority] = priority_counter.get(priority, 0) + 1
    
    print(f"Adapted {len(adapted_data)} tasks")
    print(f"Category distribution: {category_counter}")
    print(f"Priority distribution: {priority_counter}")
    
    return adapted_data, category_counter, priority_counter

def map_category(list_title):
    """Map list_title to task category using keyword matching"""
    keywords = {
        'personal': ['personal', 'home', 'family', 'personal errands'],
        'administrative': ['admin', 'administrative', 'bills', 'finance', 'paperwork'],
        'health': ['health', 'medical', 'doctor', 'exercise', 'fitness'],
        'meeting': ['meeting', 'call', 'conference', 'appointment'],
        'general': ['general', 'miscellaneous', 'other', 'to-do'],
        'academic': ['academic', 'study', 'research', 'homework', 'course'],
        'activity': ['activity', 'hobby', 'leisure', 'sports', 'entertainment']
    }
    
    # Direct mapping from keyword to index
    category_to_index = {
        'personal': 0,
        'administrative': 1,
        'health': 2,
        'meeting': 3,
        'general': 4,
        'academic': 5,
        'activity': 6
    }
    
    for category, words in keywords.items():
        if any(word in list_title for word in words):
            return category_to_index[category]
    
    # Default to General (index 4)
    return 4

def infer_priority(task_text):
    """Infer priority from task content using keyword analysis"""
    task_text_lower = task_text.lower()
    
    urgent_keywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical']
    high_keywords = ['important', 'priority', 'high', 'soon', 'deadline']
    medium_keywords = ['moderate', 'normal', 'regular']
    low_keywords = ['low', 'later', 'someday', 'optional']
    
    if any(word in task_text_lower for word in urgent_keywords):
        return 3  # Urgent
    elif any(word in task_text_lower for word in high_keywords):
        return 2  # High
    elif any(word in task_text_lower for word in medium_keywords):
        return 1  # Medium
    elif any(word in task_text_lower for word in low_keywords):
        return 0  # Low
    else:
        return 1  # Default to Medium

def prepare_category_dataset(adapted_data):
    """Prepare dataset for category classification"""
    dataset_dict = {
        'dialogue': [item['text'] for item in adapted_data],
        'label': [item['category'] for item in adapted_data]
    }
    
    metadata = {
        'num_labels': len(CATEGORY_LABELS),
        'label_names': list(CATEGORY_LABELS.values())
    }
    
    return Dataset.from_dict(dataset_dict), metadata

def prepare_priority_dataset(adapted_data):
    """Prepare dataset for priority classification"""
    dataset_dict = {
        'dialogue': [item['text'] for item in adapted_data],
        'label': [item['priority'] for item in adapted_data]
    }
    
    metadata = {
        'num_labels': len(PRIORITY_LABELS),
        'label_names': list(PRIORITY_LABELS.values())
    }
    
    return Dataset.from_dict(dataset_dict), metadata

def tokenize_dataset(dataset_dict, tokenizer, max_length=128):
    """Tokenize dataset for model input"""
    def tokenize_function(examples):
        return tokenizer(
            examples['dialogue'],
            truncation=True,
            padding='max_length',
            max_length=max_length
        )
    
    tokenized_datasets = dataset_dict.map(tokenize_function, batched=True)
    tokenized_datasets = tokenized_datasets.remove_columns(['dialogue'])
    tokenized_datasets = tokenized_datasets.rename_column('label', 'labels')
    tokenized_datasets.set_format('torch')
    
    return tokenized_datasets

def evaluate_model(model, tokenizer, test_dataset, label_names, model_name):
    """Evaluate a single model on test set"""
    print(f"\n{'='*60}")
    print(f"Evaluating {model_name}")
    print(f"{'='*60}")
    
    # Check if test dataset is empty
    if len(test_dataset) == 0:
        print(f"ERROR: Test dataset is empty!")
        return None, None, None, None
    
    # Record start time and memory
    start_time = time.time()
    start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    # Get predictions
    predictions = []
    labels = []
    confidence_scores = []
    
    model.eval()
    with torch.no_grad():
        for i in range(len(test_dataset)):
            input_ids = test_dataset[i]['input_ids'].unsqueeze(0)
            attention_mask = test_dataset[i]['attention_mask'].unsqueeze(0)
            
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)
            
            pred = torch.argmax(logits, dim=-1).item()
            label = test_dataset[i]['labels'].item()
            confidence = probs[0][pred].item()
            
            predictions.append(pred)
            labels.append(label)
            confidence_scores.append(confidence)
    
    # Check if arrays are empty
    if len(predictions) == 0 or len(labels) == 0:
        print(f"ERROR: No predictions or labels generated!")
        return None, None, None, None
    
    # Record end time and memory
    end_time = time.time()
    end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    # Calculate metrics
    accuracy = accuracy_score(labels, predictions)
    precision = precision_score(labels, predictions, average='weighted', zero_division=0)
    recall = recall_score(labels, predictions, average='weighted', zero_division=0)
    f1 = f1_score(labels, predictions, average='weighted', zero_division=0)
    
    # Per-class metrics
    precision_per_class = precision_score(labels, predictions, average=None, zero_division=0)
    recall_per_class = recall_score(labels, predictions, average=None, zero_division=0)
    f1_per_class = f1_score(labels, predictions, average=None, zero_division=0)
    
    # Confusion matrix
    cm = confusion_matrix(labels, predictions)
    
    # Resource usage
    inference_time = end_time - start_time
    memory_used = end_memory - start_memory
    
    results = {
        'model_name': model_name,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'precision_per_class': precision_per_class.tolist(),
        'recall_per_class': recall_per_class.tolist(),
        'f1_per_class': f1_per_class.tolist(),
        'confusion_matrix': cm.tolist(),
        'label_names': label_names,
        'inference_time_seconds': inference_time,
        'memory_used_mb': memory_used,
        'num_samples': len(test_dataset)
    }
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print(f"Inference Time: {inference_time:.2f}s")
    print(f"Memory Used: {memory_used:.2f}MB")
    
    return results, predictions, labels, confidence_scores

def plot_confusion_matrix(cm, label_names, output_path):
    """Plot and save confusion matrix"""
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=label_names, yticklabels=label_names)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Confusion matrix saved to: {output_path}")

def plot_per_class_metrics(precision, recall, f1, label_names, output_path):
    """Plot per-class metrics"""
    # Use actual number of classes from the data
    num_classes = len(precision)
    x = np.arange(num_classes)
    width = 0.25
    
    # Adjust label_names to match actual number of classes
    if len(label_names) > num_classes:
        label_names = label_names[:num_classes]
    elif len(label_names) < num_classes:
        label_names = list(label_names) + [f'Class {i}' for i in range(len(label_names), num_classes)]
    
    fig, ax = plt.subplots(figsize=(12, 6))
    bars1 = ax.bar(x - width, precision, width, label='Precision')
    bars2 = ax.bar(x, recall, width, label='Recall')
    bars3 = ax.bar(x + width, f1, width, label='F1')
    
    ax.set_xlabel('Class')
    ax.set_ylabel('Score')
    ax.set_title('Per-Class Performance Metrics')
    ax.set_xticks(x)
    ax.set_xticklabels(label_names, rotation=45, ha='right')
    ax.legend()
    ax.set_ylim([0, 1])
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Per-class metrics plot saved to: {output_path}")

def generate_sample_predictions(test_dataset, predictions, labels, confidence_scores, 
                                 label_names, num_samples=10):
    """Generate sample predictions with confidence scores"""
    samples = []
    
    for i in range(min(num_samples, len(predictions))):
        sample = {
            'index': i,
            'true_label': label_names[labels[i]],
            'predicted_label': label_names[predictions[i]],
            'confidence': confidence_scores[i],
            'correct': labels[i] == predictions[i]
        }
        samples.append(sample)
    
    return samples

def save_results(results, output_dir):
    """Save evaluation results to JSON file"""
    os.makedirs(output_dir, exist_ok=True)
    
    results_path = os.path.join(output_dir, 'evaluation_results.json')
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print(f"Evaluation results saved to: {results_path}")

def main():
    print("="*60)
    print("MODEL EVALUATION")
    print("="*60)
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load dataset
    data = load_mslatte_dataset(DATASET_PATH)
    adapted_data, category_counter, priority_counter = adapt_mslatte_for_task_management(data)
    
    # Prepare datasets
    category_dataset, category_metadata = prepare_category_dataset(adapted_data)
    priority_dataset, priority_metadata = prepare_priority_dataset(adapted_data)
    
    # Split into train/test (80/20)
    print(f"Category dataset size before split: {len(category_dataset)}")
    category_train_test = category_dataset.train_test_split(test_size=0.2, seed=42)
    category_test = category_train_test['test']
    print(f"Category test set size: {len(category_test)}")
    
    print(f"Priority dataset size before split: {len(priority_dataset)}")
    priority_train_test = priority_dataset.train_test_split(test_size=0.2, seed=42)
    priority_test = priority_train_test['test']
    print(f"Priority test set size: {len(priority_test)}")
    
    # Evaluate category model
    if os.path.exists(CATEGORY_MODEL_PATH):
        print(f"\nLoading category model from: {CATEGORY_MODEL_PATH}")
        category_tokenizer = AutoTokenizer.from_pretrained(CATEGORY_MODEL_PATH)
        category_model = AutoModelForSequenceClassification.from_pretrained(CATEGORY_MODEL_PATH)
        
        category_tokenized = tokenize_dataset(category_test, category_tokenizer)
        category_results, cat_preds, cat_labels, cat_conf = evaluate_model(
            category_model, category_tokenizer, category_tokenized,
            category_metadata['label_names'], 'Category Classification'
        )
        
        if category_results is not None:
            # Plot confusion matrix
            plot_confusion_matrix(
                np.array(category_results['confusion_matrix']),
                category_metadata['label_names'],
                os.path.join(OUTPUT_DIR, 'category_confusion_matrix.png')
            )
            
            # Plot per-class metrics
            plot_per_class_metrics(
                np.array(category_results['precision_per_class']),
                np.array(category_results['recall_per_class']),
                np.array(category_results['f1_per_class']),
                category_metadata['label_names'],
                os.path.join(OUTPUT_DIR, 'category_per_class_metrics.png')
            )
            
            # Generate sample predictions
            category_samples = generate_sample_predictions(
                category_tokenized, cat_preds, cat_labels, cat_conf,
                category_metadata['label_names']
            )
            category_results['sample_predictions'] = category_samples
        else:
            print("Skipping category model evaluation due to empty dataset")
            category_results = None
    else:
        print(f"Category model not found at: {CATEGORY_MODEL_PATH}")
        category_results = None
    
    # Evaluate priority model
    if os.path.exists(PRIORITY_MODEL_PATH):
        print(f"\nLoading priority model from: {PRIORITY_MODEL_PATH}")
        priority_tokenizer = AutoTokenizer.from_pretrained(PRIORITY_MODEL_PATH)
        priority_model = AutoModelForSequenceClassification.from_pretrained(PRIORITY_MODEL_PATH)
        
        priority_tokenized = tokenize_dataset(priority_test, priority_tokenizer)
        priority_results, pri_preds, pri_labels, pri_conf = evaluate_model(
            priority_model, priority_tokenizer, priority_tokenized,
            priority_metadata['label_names'], 'Priority Classification'
        )
        
        if priority_results is not None:
            # Plot confusion matrix
            plot_confusion_matrix(
                np.array(priority_results['confusion_matrix']),
                priority_metadata['label_names'],
                os.path.join(OUTPUT_DIR, 'priority_confusion_matrix.png')
            )
            
            # Plot per-class metrics
            plot_per_class_metrics(
                np.array(priority_results['precision_per_class']),
                np.array(priority_results['recall_per_class']),
                np.array(priority_results['f1_per_class']),
                priority_metadata['label_names'],
                os.path.join(OUTPUT_DIR, 'priority_per_class_metrics.png')
            )
            
            # Generate sample predictions
            priority_samples = generate_sample_predictions(
                priority_tokenized, pri_preds, pri_labels, pri_conf,
                priority_metadata['label_names']
            )
            priority_results['sample_predictions'] = priority_samples
        else:
            print("Skipping priority model evaluation due to empty dataset")
            priority_results = None
    else:
        print(f"Priority model not found at: {PRIORITY_MODEL_PATH}")
        priority_results = None
    
    # Save all results
    all_results = {
        'category_results': category_results,
        'priority_results': priority_results
    }
    save_results(all_results, OUTPUT_DIR)
    
    print("\n" + "="*60)
    print("EVALUATION COMPLETE")
    print("="*60)
    print(f"Results saved to: {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
