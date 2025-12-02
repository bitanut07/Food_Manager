package models

import "time"

type UserVouchers struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     int64     `gorm:"not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user"`
	VoucherID  int64     `gorm:"not null" json:"voucher_id"`
	Voucher    Vouchers  `gorm:"foreignKey:VoucherID" json:"voucher"`
	Used	 bool      `gorm:"not null;default:false" json:"used"`
	UsedAt    time.Time `gorm:"autoCreateTime" json:"used_at"`
}

func (UserVouchers) TableName() string {
	return "user_vouchers"
}

func (UserVouchers) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "user_id", Label: "User ID", DataType: "integer", IsSystem: false},
		{Name: "voucher_id", Label: "Voucher ID", DataType: "integer", IsSystem: false},
		{Name: "used", Label: "Used", DataType: "boolean", IsSystem: false},
		{Name: "used_at", Label: "Used At", DataType: "timestamp", IsSystem: false},
	}
}