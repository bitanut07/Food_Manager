package models

import "time"

type Payment struct {
	ID            int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID       int64     `gorm:"not null" json:"order_id"`
	Orders        Orders     `gorm:"foreignKey:OrderID" json:"order"`
	Method        string    `gorm:"type:varchar(50);not null" json:"method"`
	Amount        float64   `gorm:"type:numeric(10,2);not null" json:"amount"`
	Status        string    `gorm:"type:varchar(20);default:'pending'" json:"status"`
	TransactionID string    `gorm:"type:varchar(100)" json:"transaction_id"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Payment) TableName() string {
	return "payments"
}

func (Payment) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "order_id", Label: "Order ID", DataType: "integer", IsSystem: false},
		{Name: "method", Label: "Method", DataType: "string", IsSystem: false},
		{Name: "amount", Label: "Amount", DataType: "decimal", IsSystem: false},
		{Name: "status", Label: "Status", DataType: "string", IsSystem: false},
		{Name: "transaction_id", Label: "Transaction ID", DataType: "string", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "datetime", IsSystem: true},
	}
}
