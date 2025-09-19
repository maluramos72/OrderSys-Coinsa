import OrdersTable from "../../../src/components/OrdersTable";

function Dashboard() {
return (
    <div className="p-6">
    <h1 className="text-2xl font-bold">Panel de Control</h1>
    <OrdersTable />
    </div>
);
}

export default Dashboard;
