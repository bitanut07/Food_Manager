package models

import "time"

type Invoices struct {
	ID int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID int64 `gorm:"not null" json:"order_id"`
	Orders Orders `gorm:"foreignKey:OrderID" json:"order"`
	Subtotal float64 `gorm:"not null" json:"subtotal"`
	Tax float64 `gorm:"not null" json:"tax"`
	Total float64 `gorm:"not null" json:"total"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Invoices) TableName() string {
	return "invoices"
}

func (Invoices) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "order_id", Label: "Order ID", DataType: "integer", IsSystem: false},
		{Name: "subtotal", Label: "Subtotal", DataType: "decimal", IsSystem: false},
		{Name: "tax", Label: "Tax", DataType: "decimal", IsSystem: false},
		{Name: "total", Label: "Total", DataType: "decimal", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "timestamp", IsSystem: false},
	}
}