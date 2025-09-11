'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  UserCheck, 
  Tag, 
  TrendingUp,
  TrendingDown,
  LogOut,
  Calendar,
  FileText,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import OrderManagement from '@/components/OrderManagement'
import SimpleCalendar from '@/components/SimpleCalendar'
import { products, getLowStockProducts, getTotalInventoryValue, getTotalStockCount, getProductsByCategory } from '@/data/products'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState([
    { id: '#ORD-001', customer: 'John Smith', product: 'Nike Air Max', amount: '$129.99', status: 'Processing' },
    { id: '#ORD-002', customer: 'Sarah Johnson', product: 'Adidas Ultraboost', amount: '$179.99', status: 'Shipped' },
    { id: '#ORD-003', customer: 'Mike Davis', product: 'Converse Chuck Taylor', amount: '$65.00', status: 'Delivered' },
    { id: '#ORD-004', customer: 'Emily Wilson', product: 'Vans Old Skool', amount: '$75.00', status: 'Processing' },
    { id: '#ORD-005', customer: 'David Brown', product: 'Puma Suede Classic', amount: '$85.00', status: 'Shipped' },
  ])

  // Load orders from localStorage on component mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('shoeStoreOrders')
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders))
    } else {
      localStorage.setItem('shoeStoreOrders', JSON.stringify(orders))
    }
  }, [])

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('shoeStoreOrders', JSON.stringify(orders))
  }, [orders])

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'products', label: 'Products/Inventory', icon: Package },
    { id: 'orders', label: 'Orders/Sales', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'staff', label: 'Staff/Employees', icon: UserCheck },
    { id: 'promotions', label: 'Promotions/Campaigns', icon: Tag },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const lowStockProducts = getLowStockProducts(50)
  const totalInventoryValue = getTotalInventoryValue()
  const totalStockCount = getTotalStockCount()
  
  const stats = [
    {
      title: 'Customers',
      value: '1,247',
      change: '+89 this month',
      changeType: 'positive',
      percentage: '12%'
    },
    {
      title: 'Orders',
      value: '342',
      change: '+23 this week',
      changeType: 'positive',
      percentage: '8%'
    },
    {
      title: 'Inventory',
      value: totalStockCount.toLocaleString(),
      change: `${lowStockProducts.length} items low stock`,
      changeType: lowStockProducts.length > 0 ? 'negative' : 'positive',
      percentage: `${Math.round((lowStockProducts.length / products.length) * 100)}%`
    },
    {
      title: 'Inventory Value',
      value: `$${totalInventoryValue.toLocaleString()}`,
      change: `$${Math.round(totalInventoryValue * 0.15).toLocaleString()} this month`,
      changeType: 'positive',
      percentage: '15%'
    }
  ]


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-800'
      case 'Shipped': return 'bg-blue-100 text-blue-800'
      case 'Delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">ShoeStore</h1>
          <p className="text-sm text-gray-600">Admin Panel</p>
        </div>
        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeTab === item.id ? 'bg-primary text-white' : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-6">
          <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Administrative Panel</h2>
            <div className="mt-2 flex items-center text-gray-600">
              <span className="text-2xl font-bold text-primary mr-2">SSA</span>
              <span className="text-sm">ShoeStore Admin</span>
            </div>
          </div>

          {/* Dashboard Content */}
          {activeTab === 'dashboard' && (
            <>
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h3>
                <p className="text-gray-600 mb-6">Monday, September 10, 2024</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                      <p className="text-sm text-gray-600 mt-2">{stat.change}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.percentage}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales</CardTitle>
                    <CardDescription>Monthly sales performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-gray-500">Sales chart placeholder</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                    <CardDescription>Product stock levels by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-gray-500">Inventory chart placeholder</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium text-gray-900">{order.id}</p>
                              <p className="text-sm text-gray-600">{order.customer}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{order.product}</p>
                              <p className="text-sm text-gray-600">{order.amount}</p>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <SimpleCalendar />
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <OrderManagement />
          )}

          {/* Products/Inventory Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Products & Inventory</h3>
                  <p className="text-gray-600">Manage your product catalog and inventory levels</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Add Product
                </Button>
              </div>

              {/* Inventory Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Stock</p>
                        <p className="text-2xl font-bold text-gray-900">{totalStockCount.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Low Stock</p>
                        <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                        <p className="text-2xl font-bold text-gray-900">${totalInventoryValue.toLocaleString()}</p>
                      </div>
                      <Tag className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2" />
                      Low Stock Alert
                    </CardTitle>
                    <CardDescription className="text-red-700">
                      {lowStockProducts.length} products are running low on stock
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lowStockProducts.slice(0, 3).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                          <Badge variant="destructive">{product.stock} left</Badge>
                        </div>
                      ))}
                      {lowStockProducts.length > 3 && (
                        <p className="text-sm text-red-600 font-medium">
                          +{lowStockProducts.length - 3} more products with low stock
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Products</CardTitle>
                  <CardDescription>Complete inventory overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-600">Product</th>
                          <th className="text-left p-3 font-medium text-gray-600">Category</th>
                          <th className="text-left p-3 font-medium text-gray-600">SKU</th>
                          <th className="text-left p-3 font-medium text-gray-600">Price</th>
                          <th className="text-left p-3 font-medium text-gray-600">Stock</th>
                          <th className="text-left p-3 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-600">{product.colors.join(', ')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-gray-600">{product.category}</td>
                            <td className="p-3 text-gray-600 font-mono text-sm">{product.sku}</td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-gray-900">{product.price}</p>
                                {product.originalPrice && (
                                  <p className="text-sm text-gray-500 line-through">{product.originalPrice}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`font-medium ${
                                product.stock <= 50 ? 'text-red-600' : 
                                product.stock <= 100 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="p-3">
                              {product.badge && (
                                <Badge className={
                                  product.badge === 'New' ? 'bg-green-100 text-green-800' :
                                  product.badge === 'Sale' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {product.badge}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other tabs content */}
          {activeTab !== 'dashboard' && activeTab !== 'calendar' && activeTab !== 'orders' && activeTab !== 'products' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {sidebarItems.find(item => item.id === activeTab)?.label}
                </CardTitle>
                <CardDescription>
                  Content for {activeTab} will be implemented here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This section is under development.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
