package models

import "time"

type Braches struct {
	ID int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	AreasID int64  `gorm:"not null" json:"areas_id"`
	Area Areas `gorm:"foreignKey:AreasID" json:"area"`
	Name string `gorm:"type:varchar(100);not null" json:"name"`
	Address string `gorm:"type:varchar(255);not null" json:"address"`
	Phone string `gorm:"type:varchar(20);not null" json:"phone"`
	OpeningTime time.Time `gorm:"not null" json:"opening_time"`
	ClosingTime time.Time `gorm:"not null" json:"closing_time"`
	MaxParking int `gorm:"not null" json:"max_parking"`
}

func (Braches) TableName() string {
	return "branches"
}

func (Braches) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "areas_id", Label: "Areas ID", DataType: "integer", IsSystem: false},
		{Name: "name", Label: "Name", DataType: "string", IsSystem: false},
		{Name: "address", Label: "Address", DataType: "string", IsSystem: false},
		{Name: "phone", Label: "Phone", DataType: "string", IsSystem: false},
		{Name: "opening_time", Label: "Opening Time", DataType: "time", IsSystem: false},
		{Name: "closing_time", Label: "Closing Time", DataType: "time", IsSystem: false},
		{Name: "max_parking", Label: "Max Parking", DataType: "integer", IsSystem: false},
	}
}