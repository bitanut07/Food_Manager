package models

type BookingTable struct {
	ID        int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	TableSize int    `gorm:"not null" json:"table_size"`
	Status    string `gorm:"not null" json:"status"`
}

func (BookingTable) TableName() string {
	return "booking_table"
}

func (BookingTable) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "table_size", Label: "Table Size", DataType: "integer", IsSystem: false},
		{Name: "status", Label: "Status", DataType: "string", IsSystem: false},
	}
}
