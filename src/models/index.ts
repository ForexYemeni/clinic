// ═══════════════════════════════════════════════════════════
// 🍃 All Mongoose Models - Central Export
// ═══════════════════════════════════════════════════════════

export { UserModel } from './User';
export { ClinicModel } from './Clinic';
export { PatientModel } from './Patient';
export { VisitModel } from './Visit';
export { InvoiceModel } from './Invoice';
export { ServiceModel } from './Service';
export { EmergencyModel } from './Emergency';
export { NotificationModel } from './Notification';
export { SalaryWithdrawalModel } from './SalaryWithdrawal';
export { AuditLogModel } from './AuditLog';
export { DataResetRequestModel } from './DataResetRequest';
export { PlatformModel } from './Platform';

// Re-export interfaces
export type { IUser } from './User';
export type { IClinic } from './Clinic';
export type { IPatient } from './Patient';
export type { IVisit } from './Visit';
export type { IInvoice, IInvoiceLineItem } from './Invoice';
export type { IService } from './Service';
export type { IEmergency } from './Emergency';
export type { INotification } from './Notification';
export type { ISalaryWithdrawal } from './SalaryWithdrawal';
export type { IAuditLog } from './AuditLog';
export type { IDataResetRequest } from './DataResetRequest';
export type { IPlatform } from './Platform';
