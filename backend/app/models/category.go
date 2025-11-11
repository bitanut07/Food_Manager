package models

type Category struct {
	ID   int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null" json:"name"`
}

func (Category) TableName() string {
	return "categories"
}

func (Category) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "name", Label: "Name", DataType: "string", IsSystem: false},
	}
}
