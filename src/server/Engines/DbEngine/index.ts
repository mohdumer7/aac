//@ts-nocheck
import { MONGO_MODELS } from '@/shared/constants';
import { MongooseAdapter } from './Mongoose.adapter';
import { Access,Department,Designation,EmployeeType,Organisation,Role,User,Category, Country,QuoteStatus,SalesTeam, 
  SalesEngineer, Currency, Customer, CustomerType, CustomerContact, IndustryType,BuildingType, 
  ProjectType,
  PaintType,
  Continent,
  Region,
  State,
  Location,
  ApprovalAuthority,
  Team,
  TeamMember,
  Incoterm,
  Sector,
  ProposalRevisions,
  Quotation,
  Proposal,
  Asset,
  Vendor,
  Product,
  ProductCategory,
  Warehouse,
  Inventory,
  Option,
  UnitMeasurement,
  Ticket,
  TicketCategory,
  TicketComment,
  TicketTask,
  TicketHistory,
  UserSkill, TeamRole, SmlGroup, SmlSubGroup, SmlFile, ProductType,VisaType,
  ProviderType, DeductionType,
  PackageMaster,
  AccountMaster,
  AccountHistory,
  OtherMaster,
  UsageDetail,
  ThresholdAmount,
  JobAccount,
  PrinterMaster,
  PrinterUsage,
  Notification,
  ApprovalFlow, // Added ApprovalFlow import
UserBenefits
, UserPersonalDetails, UserEmploymentDetails, UserVisaDetails, UserIdentification
} from '@/models';




// Singleton instance tracker
let dbEngineInstance: MongooseAdapter | null = null;

function getMongooseAdapter(): MongooseAdapter {
  if (!dbEngineInstance) {
    dbEngineInstance = new MongooseAdapter({
    USER_MASTER : User,
    ORGANISATION_MASTER :Organisation,
    EMPLOYEE_TYPE_MASTER :EmployeeType,
    DEPARTMENT_MASTER : Department,
    ROLE_MASTER :Role,
    ACCESS_MASTER :Access,
    DESIGNATION_MASTER :Designation,
    CONTINENT_MASTER :Continent,
    REGION_MASTER :Region,
    COUNTRY_MASTER :Country,
    QUOTE_STATUS_MASTER :QuoteStatus,
    TEAM_MASTER : Team,
    TEAM_MEMBERS_MASTER : TeamMember,
    CURRENCY_MASTER: Currency,
    CUSTOMER_MASTER: Customer,
    CUSTOMER_TYPE_MASTER: CustomerType,
    CUSTOMER_CONTACT_MASTER: CustomerContact,
    INDUSTRY_TYPE_MASTER: IndustryType,
    BUILDING_TYPE_MASTER: BuildingType,
    PROJECT_TYPE_MASTER: ProjectType,
    PAINT_TYPE_MASTER: PaintType,
    STATE_MASTER: State,
    PRODUCT_MASTER:Product,
    PRODUCT_CATEGORY_MASTER:ProductCategory,
    WAREHOUSE_MASTER:Warehouse,
    LOCATION_MASTER: Location,
    INVENTORY_MASTER: Inventory,
    APPROVAL_AUTHORITY_MASTER: ApprovalAuthority,
    INCOTERM_MASTER: Incoterm,
    SECTOR_MASTER: Sector,
    PROPOSAL_REVISION_MASTER: ProposalRevisions,
    PROPOSAL_MASTER: Proposal,
    QUOTATION_MASTER: Quotation,
    OPTION_MASTER: Option,
    ASSET_MASTER: Asset,
    VENDOR_MASTER: Vendor,
    UNIT_MEASUREMENT_MASTER:UnitMeasurement,

    TICKET_MASTER: Ticket,
    TICKET_CATEGORY_MASTER: TicketCategory,
    TICKET_COMMENT_MASTER: TicketComment,
    TICKET_TASK_MASTER: TicketTask, 
    TICKET_HISTORY_MASTER: TicketHistory,
    USER_SKILL_MASTER: UserSkill,
    TEAM_ROLE_MASTER: TeamRole,
    SML_GROUP_MASTER: SmlGroup,
    SML_SUB_GROUP_MASTER: SmlSubGroup,
    SML_FILE_MASTER: SmlFile,
    VISA_TYPE_MASTER: VisaType,
    PRODUCT_TYPE_MASTER: ProductType,

    PROVIDER_TYPE_MASTER: ProviderType,
    DEDUCTION_TYPE_MASTER: DeductionType,
    PACKAGE_MASTER: PackageMaster,
    ACCOUNT_MASTER: AccountMaster,
    ACCOUNT_HISTORY: AccountHistory,
    OTHER_MASTER: OtherMaster,
    USAGE_DETAIL: UsageDetail,
    THRESHOLD_AMOUNT: ThresholdAmount,
    JOB_ACCOUNT: JobAccount,
    PRINTER_MASTER: PrinterMaster,
    PRINTER_USAGE: PrinterUsage ,
    NOTIFICATION_MASTER: Notification,
    [MONGO_MODELS.APPROVAL_FLOW_MASTER]: ApprovalFlow, // Added ApprovalFlow to the adapter config
    USER_PERSONAL_DETAILS: UserPersonalDetails,
    USER_BENEFITS: UserBenefits,
    USER_EMPLOYMENT_DETAILS: UserEmploymentDetails,
    USER_VISA_DETAILS: UserVisaDetails,
    USER_IDENTIFICATION: UserIdentification
    });
  }
  return dbEngineInstance;
}

export const dbEngine = {
    mongooose:getMongooseAdapter()
};
