# Data Cleaning & Reporting Automation Suite 🧹📊

An end-to-end data preprocessing, deduplication, imputation, harmonization, and automated reporting pipeline built in Python and JavaScript.

---

## 🎯 Key Capabilities & Pipeline Architecture

1. **Automated Cleaning Pipeline (`pipeline.py`)**:
   - **Deduplication**: Identifies and resolves exact and primary key (`TransactionID`) collision duplicates.
   - **Missing Value Imputation**: Median category imputation for missing transaction amounts, standard format defaults for dates and emails.
   - **Categorical Harmonization**: Normalizes synonym variations and inconsistent casing (e.g. `['ny', 'New York', 'N.Y.', 'NY']` -> `'New York'`).
   - **Data Validation & Type Casting**: Standardizes phone numbers to `(XXX) XXX-XXXX` format, validates emails against regex patterns, and parses multi-format dates (`YYYY-MM-DD`, `MM/DD/YYYY`, `DD-Mon-YYYY`) into ISO standard.
   - **Anomaly & Outlier Resolution**: Inverts negative invalid revenue/quantity values and applies IQR / 99th percentile capping to eliminate artificial outliers.
   - **Audit Trail Logging**: Records row counts, severity levels, and automated rules applied across each stage.

2. **Automated Reporting & Metrics**:
   - **Initial Raw Health Score**: `98.1%` (dirty records, nulls, duplicates)
   - **Post-Pipeline Cleaned Health Score**: `100.0%` (production-ready)
   - **Automated Exports**: Exports `raw_uncleaned_data.csv`, `cleaned_production_data.csv`, and `cleaning_report.json`.

3. **Interactive Reporting Dashboard (`index.html`, `style.css`, `app.js`)**:
   - **Executive KPIs**: Cleaned volume, duplicate count, missing fields handled, and data health index.
   - **Step-by-Step Audit Cards**: Visual diagnosis of each pipeline rule and affected row counts.
   - **Visual Summaries**: Revenue contribution by harmonized category and order volume across standardized metro cities.
   - **Cohort Slicers & Live Search**: Filter by category, city, payment channel, and instant customer search.
   - **Excel & Audit Log Exports**: One-click download of production data and audit logs.

---

## 📂 Project Structure

```
data-cleaning-automation/
├── pipeline.py                 # Automated Python data cleaning & reporting pipeline
├── raw_uncleaned_data.csv      # Generated messy dataset (nulls, duplicates, typos)
├── cleaned_production_data.csv # Harmonized, production-ready dataset
├── cleaning_report.json        # Structured audit log & visual summaries
├── index.html                  # Dashboard layout
├── style.css                   # Glassmorphic responsive styling & dark/light themes
├── app.js                      # Interactive charts, slicers, and Excel export
└── README.md                   # Project documentation
```

---

## 🚀 How to Run

1. **Execute the Cleaning Pipeline** (Optional):
   ```bash
   python pipeline.py
   ```

2. **Open the Interactive Reporting Dashboard**:
   ```bash
   python -m http.server 8083
   ```
   Navigate to **http://localhost:8083** in your browser.
