package models

type Ingredients struct {
	ID          int64   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string  `gorm:"not null;unique" json:"name"`
	Quantity    float64 `gorm:"not null" json:"quantity"`
	Unit        string  `gorm:"not null" json:"unit"`
	Threshold   float64 `gorm:"not null" json:"threshold"`
}

func (Ingredients) TableName() string {
	return "ingredients"
}

func (Ingredients) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "name", Label: "Name", DataType: "string", IsSystem: false},
		{Name: "quantity", Label: "Quantity", DataType: "decimal", IsSystem: false},
		{Name: "unit", Label: "Unit", DataType: "string", IsSystem: false},
		{Name: "threshold", Label: "Threshold", DataType: "decimal", IsSystem: false},
	}
}