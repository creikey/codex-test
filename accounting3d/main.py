import csv
from pathlib import Path
from collections import defaultdict

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401

DATA_FILE = Path(__file__).resolve().parent.parent / 'data' / 'sample_transactions.csv'


def load_data(csv_file):
    totals = defaultdict(float)
    with open(csv_file, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            category = row['Category']
            amount = float(row['Amount'])
            totals[category] += amount
    return totals


def plot_totals(totals):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    categories = list(totals.keys())
    amounts = list(totals.values())
    xs = range(len(categories))
    ys = [0] * len(categories)
    zs = [0] * len(categories)

    dx = dy = 0.5
    ax.bar3d(xs, ys, zs, dx, dy, amounts, color='skyblue')
    ax.set_xticks([x + dx / 2 for x in xs])
    ax.set_xticklabels(categories)
    ax.set_ylabel('Category')
    ax.set_zlabel('Amount')
    ax.set_title('Totals by Category')

    plt.show()


def main():
    totals = load_data(DATA_FILE)
    plot_totals(totals)


if __name__ == '__main__':
    main()
