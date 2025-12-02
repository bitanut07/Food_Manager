package models

import "time"

type Vouchers struct {
	ID                int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Code              string    `gorm:"type:varchar(50);not null;unique" json:"code"`
	Description       string    `gorm:"type:text" json:"description"`
	Image             string    `gorm:"type:text" json:"image"`
	DiscountType      string    `gorm:"type:varchar(10);not null" json:"discount_type"`
	DiscountValue     float64   `gorm:"not null" json:"discount_value"`
	MinOrder          float64   `gorm:"not null;default:0" json:"min_order"`
	MaxDiscount       float64   `gorm:"not null;default:0" json:"max_discount"`
	StartDate         time.Time `gorm:"not null" json:"start_date"`
	EndDate           time.Time `gorm:"not null" json:"end_date"`
	UsageLimitGlobal  int64     `gorm:"not null;default:0" json:"usage_limit_global"`
	UsageLimitPerUser int64     `gorm:"not null;default:0" json:"usage_limit_per_user"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Vouchers) TableName() string {
	return "vouchers"
}

func (Vouchers) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "code", Label: "Code", DataType: "string", IsSystem: false},
		{Name: "description", Label: "Description", DataType: "text", IsSystem: false},
		{Name: "image", Label: "Image", DataType: "text", IsSystem: false},
		{Name: "discount_type", Label: "Discount Type", DataType: "string", IsSystem: false},
		{Name: "discount_value", Label: "Discount Value", DataType: "decimal", IsSystem: false},
		{Name: "min_order", Label: "Min Order", DataType: "decimal", IsSystem: false},
		{Name: "max_discount", Label: "Max Discount", DataType: "decimal", IsSystem: false},
		{Name: "start_date", Label: "Start Date", DataType: "date", IsSystem: false},
		{Name: "end_date", Label: "End Date", DataType: "date", IsSystem: false},
		{Name: "usage_limit_global", Label: "Usage Limit Global", DataType: "integer", IsSystem: false},
		{Name: "usage_limit_per_user", Label: "Usage Limit Per User", DataType: "integer", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "timestamp", IsSystem: false},
	}
}
