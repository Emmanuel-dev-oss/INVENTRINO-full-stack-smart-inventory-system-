The `data/db.json` file is created automatically the first time the server starts. You do not need to set it up manually.

---

## API Reference

All endpoints return JSON in the format `{ success: true, data: … }` or `{ success: false, message: "…" }`.

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Get all categories (metadata only) |
| POST | `/api/categories` | Create a new category |
| PATCH | `/api/categories/:catId` | Update category name or heading |
| DELETE | `/api/categories/:catId` | Delete a category and all its products |

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories/:catId/products` | Get paginated + searchable products |
| POST | `/api/categories/:catId/products/single` | Add a single product |
| POST | `/api/categories/:catId/products/multi` | Add a multi product |
| PATCH | `/api/categories/:catId/products/:prodId/single` | Edit a single product |
| PATCH | `/api/categories/:catId/products/:prodId/multi` | Edit a multi product |
| POST | `/api/categories/:catId/products/:prodId/sell/single` | Record a sale (single) |
| POST | `/api/categories/:catId/products/:prodId/sell/multi` | Record a sale (multi — unit or base) |
| POST | `/api/categories/:catId/products/:prodId/addstock/single` | Restock a single product |
| POST | `/api/categories/:catId/products/:prodId/addstock/multi` | Restock a multi product |
| DELETE | `/api/categories/:catId/products/:prodId` | Delete a product |
| GET | `/api/categories/:catId/products/:prodId/history` | Get full transaction history |

### Query Parameters (GET products)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 5 | Products per page |
| `search` | string | — | Filter by product name |

---

## Usage Guide

### Creating your first inventory

1. Click **New Inventory** in the sidebar
2. Type a name (e.g. "Electronics" or "Grocery Store") and press Enter
3. The inventory opens automatically and is ready for products

### Adding a single product

1. Click **Add Product** and choose **Single Product**
2. Fill in the product name, quantity, cost price, and selling price
3. Leave **Auto-Calculate** on to have totals computed for you
4. Click **Save Product** — it appears in the table immediately

### Adding a multi product

1. Click **Add Product** and choose **Multi Product**
2. Fill in the product name and unit details (e.g. Carton, quantity 25, cost $20, sell $30)
3. Fill in the base unit name (e.g. Sachet) and the conversion rate (e.g. 30 sachets per carton)
4. With **Auto-Calculate** on, all totals and per-base prices are filled automatically
5. Click **Save Product** — both the unit row and base unit row appear in the table

### Recording a sale

1. Click the **Sell** button on any product row
2. Enter the quantity to sell and confirm or adjust the selling price
3. The preview shows your revenue, cost, and profit or loss before you confirm
4. Click **Confirm Sale** — stock is deducted and the transaction is logged

### Checking sales history

1. Click the **History** button on any product
2. The summary at the top shows total sales count, units sold, revenue, and net profit
3. Scroll through the timeline to see every individual transaction with full details

### Monitoring stock levels

The **Stock Status & Alerts** table beneath every product list updates automatically. Set your low stock threshold when adding a product — once quantity falls to that number, the status switches from **In Stock** to **Low Stock** in amber. When it reaches zero it shows **Out of Stock** in red.

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request describing what you changed and why

Please keep pull requests focused — one feature or fix per PR makes review much easier.

---

## License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it for personal or commercial purposes. See the `LICENSE` file for full details.

---

*Built with simplicity and practicality in mind — because good tools should get out of your way and let you focus on your business.*
