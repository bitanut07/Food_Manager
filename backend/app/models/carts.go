package models

import "time"

type Carts struct {
	ID int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID int64 `gorm:"not null" json:"user_id"`
	User User `gorm:"foreignKey:UserID" json:"user"`
	Status string `gorm:"type:varchar(50);default:'active'" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Carts) TableName() string {
	return "carts"
}

func (Carts) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "user_id", Label: "User ID", DataType: "integer", IsSystem: false},
		{Name: "status", Label: "Status", DataType: "string", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "datetime", IsSystem: true},
	}
}