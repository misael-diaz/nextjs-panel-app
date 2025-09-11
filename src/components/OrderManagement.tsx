'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Order {
  id: string
  customer: string
  product: string
  amount: string
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [newOrder, setNewOrder] = useState({
    customer: '',
    product: '',
    amount: '',
    status: 'Processing' as const
  })

  // Load orders from localStorage on component mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('shoeStoreOrders')
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders))
    }
  }, [])

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('shoeStoreOrders', JSON.stringify(orders))
  }, [orders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-800'
      case 'Shipped': return 'bg-blue-100 text-blue-800'
      case 'Delivered': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateOrder = () => {
    if (!newOrder.customer || !newOrder.product || !newOrder.amount) {
      alert('Please fill in all required fields')
      return
    }

    const order: Order = {
      id: `#ORD-${String(orders.length + 1).padStart(3, '0')}`,
      customer: newOrder.customer,
      product: newOrder.product,
      amount: newOrder.amount,
      status: newOrder.status
    }

    setOrders(prev => [...prev, order])
    setNewOrder({
      customer: '',
      product: '',
      amount: '',
      status: 'Processing'
    })
    setIsDialogOpen(false)
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setNewOrder({
      customer: order.customer,
      product: order.product,
      amount: order.amount,
      status: order.status
    })
    setIsDialogOpen(true)
  }

  const handleUpdateOrder = () => {
    if (!editingOrder || !newOrder.customer || !newOrder.product || !newOrder.amount) {
      alert('Please fill in all required fields')
      return
    }

    setOrders(prev => prev.map(order => 
      order.id === editingOrder.id 
        ? { ...order, ...newOrder }
        : order
    ))
    
    setEditingOrder(null)
    setNewOrder({
      customer: '',
      product: '',
      amount: '',
      status: 'Processing'
    })
    setIsDialogOpen(false)
  }

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      setOrders(prev => prev.filter(order => order.id !== orderId))
    }
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as Order['status'] }
        : order
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">Manage customer orders and track their status</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingOrder(null)
              setNewOrder({
                customer: '',
                product: '',
                amount: '',
                status: 'Processing'
              })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? 'Edit Order' : 'Add New Order'}
              </DialogTitle>
              <DialogDescription>
                {editingOrder ? 'Update the order details.' : 'Add a new order to the system.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">
                  Customer
                </Label>
                <Input 
                  id="customer" 
                  className="col-span-3" 
                  placeholder="Customer name"
                  value={newOrder.customer}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product" className="text-right">
                  Product
                </Label>
                <Input 
                  id="product" 
                  className="col-span-3" 
                  placeholder="Product name"
                  value={newOrder.product}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, product: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input 
                  id="amount" 
                  className="col-span-3" 
                  placeholder="$0.00"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={newOrder.status} onValueChange={(value: any) => setNewOrder(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingOrder ? handleUpdateOrder : handleCreateOrder}>
                {editingOrder ? 'Update Order' : 'Add Order'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Manage and track all customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
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
                  <div className="flex items-center gap-2">
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Shipped">Shipped</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No orders found. Add your first order to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


