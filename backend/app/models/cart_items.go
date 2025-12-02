package models

type CartItem struct {
	ID int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	CartID int64 `gorm:"not null" json:"cart_id"`
	Cart Carts `gorm:"foreignKey:CartID" json:"cart"`
	ProductID int64 `gorm:"not null" json:"product_id"`
	Product Product `gorm:"foreignKey:ProductID" json:"product"`
	Quantity int `gorm:"not null" json:"quantity"`
}

func (CartItem) TableName() string {
	return "cart_items"
}

func (CartItem) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "cart_id", Label: "Cart ID", DataType: "integer", IsSystem: false},
		{Name: "product_id", Label: "Product ID", DataType: "integer", IsSystem: false},
		{Name: "quantity", Label: "Quantity", DataType: "integer", IsSystem: false},
	}
}