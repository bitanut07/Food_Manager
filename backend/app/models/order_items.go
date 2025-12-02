package models

type OrderItems struct {
	ID int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID int64 `gorm:"not null" json:"order_id"`
	Order Orders `gorm:"foreignKey:OrderID" json:"order"`
	ProductID int64 `gorm:"not null" json:"product_id"`
	Product Product `gorm:"foreignKey:ProductID" json:"product"`
	Quantity int `gorm:"not null" json:"quantity"`
	UnitPrice float64 `gorm:"not null" json:"unit_price"`
}

func (OrderItems) TableName() string {
	return "order_items"
}

func (OrderItems) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "order_id", Label: "Order ID", DataType: "integer", IsSystem: false},
		{Name: "product_id", Label: "Product ID", DataType: "integer", IsSystem: false},
		{Name: "quantity", Label: "Quantity", DataType: "integer", IsSystem: false},
		{Name: "unit_price", Label: "Unit Price", DataType: "decimal", IsSystem: false},
	}
}