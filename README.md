# codex-test

This repository demonstrates a simple prototype for **3D accounting software**. The
sample application reads transaction data from `data/sample_transactions.csv` and
visualizes totals by category using a 3D bar chart.

## Requirements

- Python 3.8+
- `matplotlib` (see `requirements.txt`)

Install dependencies with:

```bash
pip install -r requirements.txt
```

## Running

Execute the following to launch the demo visualization:

```bash
python -m accounting3d.main
```

This will open a window showing category totals rendered as 3D bars.
