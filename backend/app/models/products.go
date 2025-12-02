package models

import (
	"time"

	"github.com/goravel/framework/database/orm"
)

type Product struct {
	orm.Model
	ID          int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	CategoryID  int64     `gorm:"not null" json:"category_id"`
	Category    Category  `gorm:"foreignKey:CategoryID" json:"category"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"not null" json:"description"`
	Price       float64   `gorm:"not null" json:"price"`
	Thumbnail   string    `gorm:"not null" json:"thumbnail"`
	Status      bool      `gorm:"not null" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   time.Time `gorm:"index" json:"deleted_at"`
}

func (Product) TableName() string {
	return "products"
}

func (Product) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "category_id", Label: "Category ID", DataType: "integer", IsSystem: true},
		{Name: "name", Label: "Name", DataType: "string", IsSystem: false},
		{Name: "description", Label: "Description", DataType: "string", IsSystem: false},
		{Name: "price", Label: "Price", DataType: "decimal", IsSystem: false},
		{Name: "thumbnail", Label: "Thumbnail", DataType: "string", IsSystem: false},
		{Name: "status", Label: "Status", DataType: "boolean", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "datetime", IsSystem: true},
		{Name: "updated_at", Label: "Updated At", DataType: "datetime", IsSystem: true},
		{Name: "deleted_at", Label: "Deleted At", DataType: "datetime", IsSystem: true},
	}
}
