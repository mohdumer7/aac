import { 
    UserRoundCheck, 
    Package2, 
    Boxes, 
    Store, 
    PackageSearch, 
    MonitorDot,
    Tags,
    Building2
} from "lucide-react"

export const MenuItemicons: { [key: string]: React.ComponentType } = {
    "Global Admin": UserRoundCheck,
    "Inventory": Package2,
    "Product Categories": Tags,
    "Products": Boxes,
    "Warehouses": Building2,
    "Stock": Store,
    "Assets": MonitorDot,
    "Vendors": PackageSearch
}