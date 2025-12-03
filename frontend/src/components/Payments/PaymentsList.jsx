import React, { useState } from 'react';
import { mockPayments } from '../../mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Download, Plus, DollarSign, CreditCard, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import AddPaymentForm from './AddPaymentForm';

const PaymentsList = () => {
  const [payments, setPayments] = useState(mockPayments);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  const handleAddPayment = (newPayment) => {
    setPayments([...payments, newPayment]);
    setShowAddDialog(false);
  };

  const handleDownloadInvoice = (payment) => {
    // Mock download - in real app, generate PDF invoice
    alert(`Downloading invoice ${payment.invoiceNo}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payments & Invoices</h1>
          <p className="text-gray-400">Track payments and generate invoices</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Record Payment</DialogTitle>
            </DialogHeader>
            <AddPaymentForm onSubmit={handleAddPayment} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${totalRevenue}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Paid</CardTitle>
            <CreditCard className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${paidAmount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
            <Clock className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${pendingAmount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by member or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-600 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{payment.memberName}</h3>
                      <Badge className={payment.status === 'paid' ? 'bg-green-600' : 'bg-orange-600'}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Invoice: </span>
                        <span className="text-white font-medium">{payment.invoiceNo}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Plan: </span>
                        <span className="text-blue-400 font-medium">{payment.plan}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Method: </span>
                        <span className="text-white font-medium">{payment.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Date: </span>
                        <span className="text-white font-medium">{payment.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${payment.amount}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-700"
                      onClick={() => handleDownloadInvoice(payment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No payments found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsList;
