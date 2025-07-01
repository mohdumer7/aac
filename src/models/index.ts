// MASTER MODELS 
import Access from "./master/Access.model"
import Department from "./master/Department.model"
import Designation from "./master/Designation.model"
import EmployeeType from "./master/EmployeeType.model"
import Organisation from "./master/Organisation.model"
import Role from "./master/Role.model"
import User from "./master/User.model"
import Continent from "./master/Continent.model"
import Region from "./master/Region.model"
import Country from "./master/Country.model"
import QuoteStatus from "./master/QuoteStatus.model"
import Team from "./master/Team.model"
import TeamMember from "./master/TeamMember.model"
import Currency from "./master/Currency.model"
import Customer from "./master/Customer.model"
import CustomerType from "./master/CustomerType.model"
import CustomerContact from "./master/CustomerContacts.model"
import IndustryType from "./master/IndustryType.model"
import BuildingType from "./master/BuildingType.model"
import ProjectType from "./master/ProjectType.model"
import PaintType from "./master/PaintType.model"
import State from "./master/State.model"
import Location from "./master/Location.model"
import ApprovalAuthority from "./master/ApprovalAuthority.model"
import Incoterm from "./master/Incoterm.model"
import Sector from "./master/Sector.model"
import Quotation from "./aqm/QuotationModel.model"

// AQM
import ProposalRevisions from "./aqm/ProposalRevisions.model"
import Proposal from "./aqm/Proposals.model"

// Asset and Inventory
import Asset from "./master/Asset.model"
import Vendor from "./master/Vendor.model"
import ProductCategory from "./master/ProductCategory.model"
import Product from "./master/Product.model"
import Warehouse from "./master/Warehouse.model"
import Inventory from "./master/Inventory.model"
import { default as UnitMeasurement } from "./master/UnitMeasurement";
import { default as ApprovalFlow } from "./approvals/ApprovalFlow.model";
import Option from "./aqm/OptionsModel.model"
import Ticket from "./ticket/Ticket.model";
import TicketCategory from "./ticket/TicketCategory.model";
import TicketComment from "./ticket/TicketComment.model";
import TicketTask from "./ticket/TicketTask.model";
import TicketHistory from "./ticket/TicketHistory.model";
import UserSkill from "./ticket/UserSkill.model";
import TeamRole from "./master/TeamRole.model";
import SmlGroup from "./sml/Group.model";
import SmlSubGroup from "./sml/SmlSubGroup.model";
import SmlFile from "./sml/SMLFile.model"
import VisaType from "./master/VisaType.model"
import ProductType from "./master/ProductType.model";
import ProviderType from "./itapplications/ProviderType.model";
import DeductionType from "./itapplications/DeductionType.model"
import PackageMaster from "./itapplications/PackageMaster.model"
import AccountMaster from "./itapplications/AccountMaster.model"
import AccountHistory from "./itapplications/AccountHistory.model"
import OtherMaster from "./itapplications/OtherMaster.model"
import UsageDetail from "./itapplications/UsageDetail.model"
import ThresholdAmount from "./itapplications/ThresholdAmount.model"
import JobAccount from "./itapplications/JobAccount.model"
import PrinterMaster from "./itapplications/PrinterMaster.model"
import PrinterUsage from "./itapplications/PrinterUsage.model"
import Notification from "./notification/Notification";
import UserPersonalDetails from "./master/UserPersonalDetails.model";
import UserBenefits from "./master/UserBenefits.model"
import UserEmploymentDetails from "./master/UserEmploymentDetails.model";
import UserVisaDetails from "./master/UserVisaDetails.model";
import UserIdentification from "./master/UserIdentification.model";

export { 
    Access, Department, Designation, EmployeeType, Organisation, Role, User, 
    Continent, Region, Country, QuoteStatus, Team, TeamMember, Currency, Customer,
    CustomerType, CustomerContact, IndustryType, BuildingType, ProjectType, 
    PaintType, State, Location, ApprovalAuthority, Incoterm, Sector, 
    ProposalRevisions, Proposal, Quotation,Option,
    // Asset and Inventory exports
    Asset, Vendor, ProductCategory, Product, Warehouse, Inventory, UnitMeasurement,
    ApprovalFlow,
    // Tickets
    Ticket,
    TicketCategory,
    TicketComment,
    TicketTask,
    TicketHistory,
    UserSkill,
    TeamRole,
    SmlGroup,
    SmlSubGroup,
    SmlFile,
    VisaType,
    ProductType,

    // itapplications

    ProviderType,
    DeductionType,
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
    UserPersonalDetails,
    UserBenefits,
    UserEmploymentDetails,
    UserVisaDetails,
    UserIdentification
    
}
