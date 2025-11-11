package models

import (
	"time"
)

// User represents the users table in the database.
type Auth struct {
	ID          int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email       string     `gorm:"type:varchar(255);unique;not null" json:"email"`
	Password    string     `gorm:"type:varchar(255);not null" json:"password"`
	FullName    string     `gorm:"type:varchar(100)" json:"full_name"`
	Phone       string     `gorm:"type:varchar(20)" json:"phone"`
	Gender      string     `gorm:"type:varchar(10)" json:"gender"`
	DateOfBirth *time.Time `gorm:"type:date" json:"date_of_birth"`
	Address     string     `gorm:"type:text" json:"address"`
	Role        string     `gorm:"type:varchar(20);default:'user'" json:"role"`
	IsActive    bool       `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	LastLogin   *time.Time `gorm:"type:timestamp" json:"last_login"`
}

// TableName sets the name of the database table.
func (Auth) TableName() string {
	return "users"
}

// Field represents metadata for model fields (used for auto-generating admin panels, etc.)
type Field struct {
	Name     string `json:"name"`
	Label    string `json:"label"`
	DataType string `json:"data_type"`
	IsSystem bool   `json:"is_system"`
}

// GetFields returns metadata of User fields.
func (Auth) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "email", Label: "Email", DataType: "string", IsSystem: false},
		{Name: "password", Label: "Password", DataType: "string", IsSystem: false},
		{Name: "full_name", Label: "Full Name", DataType: "string", IsSystem: false},
		{Name: "phone", Label: "Phone", DataType: "string", IsSystem: false},
		{Name: "gender", Label: "Gender", DataType: "string", IsSystem: false},
		{Name: "date_of_birth", Label: "Date of Birth", DataType: "date", IsSystem: false},
		{Name: "address", Label: "Address", DataType: "string", IsSystem: false},
		{Name: "role", Label: "Role", DataType: "string", IsSystem: false},
		{Name: "is_active", Label: "Is Active", DataType: "boolean", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "datetime", IsSystem: true},
		{Name: "last_login", Label: "Last Login", DataType: "datetime", IsSystem: true},
	}
}

// UserResponse defines what will be returned in JSON APIs.
type AuthResponse struct {
	ID          int64      `json:"id"`
	Email       string     `json:"email"`
	FullName    string     `json:"full_name"`
	Phone       string     `json:"phone"`
	Gender      string     `json:"gender"`
	DateOfBirth *time.Time `json:"date_of_birth"`
	Address     string     `json:"address"`
	Role        string     `json:"role"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	LastLogin   *time.Time `json:"last_login"`
}

func (AuthResponse) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "email", Label: "Email", DataType: "string", IsSystem: false},
		{Name: "full_name", Label: "Full Name", DataType: "string", IsSystem: false},
		{Name: "phone", Label: "Phone", DataType: "string", IsSystem: false},
		{Name: "gender", Label: "Gender", DataType: "string", IsSystem: false},
		{Name: "date_of_birth", Label: "Date of Birth", DataType: "date", IsSystem: false},
		{Name: "address", Label: "Address", DataType: "string", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "datetime", IsSystem: true},
		{Name: "last_login", Label: "Last Login", DataType: "datetime", IsSystem: true},
	}
}
