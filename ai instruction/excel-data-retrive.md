**Goal: Implement 'Excel Data Service' for Bulk Product Insertion and Sales Recording.**

This service supports two product insertion modes: **Bulk (via Excel upload)** and **Regular (via form data)**.

---

### **Core Implementation Requirements:**

1.  **File Context:**
    * The Excel file upload option should be configured within: `#file:products.component.ts`. Don't touch form base product insertion. For excel data extraction create a service or component where all the excel data processing and mapping and previewing will be done.

2.  **Product Insertion (Bulk Mode):**
    * Excel data will be inserted into the **products collection**. Create an other service to save data to database.
    * Mapping must be done to the fields defined in the model: `#file:stock-in.model.ts` (fields similar to Excel data).
    **Column Mapping:**
    * Match the following Excel column headers to the properties in the ExcelData TypeScript interface. If a header doesn't have a direct match, please note that.

    * **Excel Column Headers:**
        * No, Date, Item, Brand, Series, Model, Processor, Genaration, RAM, ROM, Product ID, Cost Price, Asking Price, Revenue, Net Revenue, Sock Out Date, S. Invoice No, Status, FeedBack

    * **ExcelData Interface Properties:**
        * No, Date, Item, Brand, Series, Model, Processor, Genaration, RAM, ROM, ProductID, CostPrice, AskingPrice, Revenue, NetRevenue, SockOutDate, SaleInvoiceNo, Status, FeedBack

3.  **Sales Record Insertion:**
    * Insert data into the **sales collection** only if the Excel column `ExcelData.Status` has the value "**Sold**".

4.  **User Interface & Flow:**
    * Display the **first 100 rows** of Excel data on a grid for user review and editing.
    * Allow the user to **edit/correct** the displayed data.
    * Upon user saving, insert the corrected 100 rows into the database.
    * After a successful save, automatically prepare the **next 100 rows** for review and insertion (pagination/batching).

5.  **Data Type Conversions:**

    * **Date Conversion:**
        * Excel dates are in **mm/dd/yyyy** format (for fields like `ExcelData.Date` and `SockOutDate`).
        * Implement necessary conversion before database insertion.

    * **Number Conversion:**
        * Convert the following fields to the correct **number type** : `CostPrice`, `Revenue`, `NetRevenue`.

6. 



