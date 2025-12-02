package models

import "time"

type Reservation struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	PhoneNumber     string    `gorm:"type:varchar(15);not null" json:"phone_number"`
	FullName        string    `gorm:"type:varchar(100);not null" json:"full_name"`
	Email           string    `gorm:"type:varchar(100);not null" json:"email"`
	ReservationDate time.Time `gorm:"type:date;not null" json:"reservation_date"`
	ReservationTime string    `gorm:"type:varchar(8);not null" json:"reservation_time"`
	GuestCount      int       `gorm:"not null" json:"guest_count"`
	Notes           string    `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	Status          string    `gorm:"type:varchar(50);not null" json:"status"`
}

func (Reservation) TableName() string {
	return "reservations"
}

func (Reservation) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "phone_number", Label: "Phone Number", DataType: "string", IsSystem: false},
		{Name: "full_name", Label: "Full Name", DataType: "string", IsSystem: false},
		{Name: "email", Label: "Email", DataType: "string", IsSystem: false},
		{Name: "reservation_date", Label: "Reservation Date", DataType: "date", IsSystem: false},
		{Name: "reservation_time", Label: "Reservation Time", DataType: "time", IsSystem: false},
		{Name: "guest_count", Label: "Guest Count", DataType: "integer", IsSystem: false},
		{Name: "notes", Label: "Notes", DataType: "text", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "timestamp", IsSystem: false},
		{Name: "status", Label: "Status", DataType: "string", IsSystem: false},
	}
}
