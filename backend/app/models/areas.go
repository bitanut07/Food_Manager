package models

type Areas struct {
	ID      int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	District string `gorm:"type:varchar(100);not null" json:"district"`
	City    string `gorm:"type:varchar(100);not null" json:"city"`
}

func (Areas) TableName() string {
	return "areas"
}

func (Areas) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "district", Label: "District", DataType: "string", IsSystem: false},
		{Name: "city", Label: "City", DataType: "string", IsSystem: false},
	}
}