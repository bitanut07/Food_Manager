package models

import "time"

type Reviews struct {
	ID int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID int64 `gorm:"not null" json:"order_id"`
	Order Orders `gorm:"foreignKey:OrderID" json:"order"`
	ProductID int64 `gorm:"not null" json:"product_id"`
	Product Product `gorm:"foreignKey:ProductID" json:"product"`
	UserID int64 `gorm:"not null" json:"user_id"`
	User User `gorm:"foreignKey:UserID" json:"user"`
	Rating int `gorm:"not null" json:"rating"`
	Comment string `gorm:"type:text" json:"comment"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Reviews) TableName() string {
	return "reviews"
}

func (Reviews) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "order_id", Label: "Order ID", DataType: "integer", IsSystem: false},
		{Name: "product_id", Label: "Product ID", DataType: "integer", IsSystem: false},
		{Name: "user_id", Label: "User ID", DataType: "integer", IsSystem: false},
		{Name: "rating", Label: "Rating", DataType: "integer", IsSystem: false},
		{Name: "comment", Label: "Comment", DataType: "text", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "timestamp", IsSystem: false},
	}
}