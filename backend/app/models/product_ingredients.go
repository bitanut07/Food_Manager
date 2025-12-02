package models

type ProductIngredient struct {
	ProductID int64 `gorm:"primaryKey;column:product_id"`
	IngredientID int64 `gorm:"primaryKey;column:ingredient_id"`
	AmountUsed float64 `gorm:"not null;column:amount_used" json:"amount_used"`
}

func (ProductIngredient) TableName() string {
	return "product_ingredients"
}

func (ProductIngredient) GetFields() []Field {
	return []Field{
		{Name: "product_id", Label: "Product ID", DataType: "integer", IsSystem: true},
		{Name: "ingredient_id", Label: "Ingredient ID", DataType: "integer", IsSystem: true},
		{Name: "amount_used", Label: "Amount Used", DataType: "decimal", IsSystem: false},
	}
}