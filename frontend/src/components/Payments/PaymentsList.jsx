import React, { useState, useEffect } from 'react';
import { paymentsAPI, membersAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Download, Plus, DollarSign, CreditCard, Clock, Loader2, Copy, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import AddPaymentForm from './AddPaymentForm';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';

const PaymentsList = () => {
  const { user, isMember } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [user, isMember]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentsAPI.getAll();
      
      // If user is a member, filter to show only their payments
      if (isMember && user?.email) {
        // First, get the member's ID from the members table
        const members = await membersAPI.getAll();
        const currentMember = members.find(m => m.email === user.email);
        
        if (currentMember) {
          setCurrentMemberId(currentMember.id);
          // Filter payments to only show this member's payments
          const memberPayments = data.filter(p => p.member_id === currentMember.id);
          setPayments(memberPayments || []);
        } else {
          setPayments([]);
        }
      } else {
        // Admin/Trainer sees all payments
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.member_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const paidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const [createdMemberInfo, setCreatedMemberInfo] = useState(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  const handleAddPayment = async (newPayment) => {
    try {
      // Store password before sending (it won't be returned from API)
      const passwordToShow = newPayment.password || 'Auto-generated password (check email)';
      
      // Use the new endpoint that creates member with payment
      const result = await paymentsAPI.createWithMember(newPayment);
      console.log('Payment created successfully:', result);
      
      // Show credentials dialog with the password
      setCreatedMemberInfo({
        name: newPayment.full_name,
        email: newPayment.email,
        password: passwordToShow
      });
      setShowCredentialsDialog(true);
      
      toast({
        title: 'Success',
        description: 'Member added and payment recorded successfully',
      });
      setShowAddDialog(false);
      fetchPayments();
    } catch (error) {
      console.error('Add payment error:', error);
      const errorMessage = error.message || 'Failed to add member and record payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadInvoice = (payment) => {
    // Mock download - in real app, generate PDF invoice
    toast({
      title: 'Info',
      description: `Downloading invoice ${payment.invoice_number}`,
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isMember ? 'My Payments' : 'Payments & Invoices'}
          </h1>
          <p className="text-gray-400">
            {isMember ? 'View your payment history' : 'Track payments and generate invoices'}
          </p>
        </div>
        {!isMember && (
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
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Paid</CardTitle>
            <CreditCard className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${paidAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
            <Clock className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${pendingAmount.toFixed(2)}</div>
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
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        Invoice: {payment.invoice_number}
                      </h3>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div className="text-gray-400">
                        <span className="font-medium">Member:</span> {payment.member_id}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium">Amount:</span> ${parseFloat(payment.amount).toFixed(2)}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium">Method:</span> {payment.payment_method}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium">Date:</span> {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="mt-2 text-sm text-gray-500">
                        Note: {payment.notes}
                      </div>
                    )}
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
            ))}
          </div>
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {isMember ? 'You have no payment records yet.' : 'No payment records found.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Dialog - Show password after member creation */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Member Created Successfully!
            </DialogTitle>
          </DialogHeader>
          {createdMemberInfo && (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg">
                <p className="text-green-400 text-sm mb-3">
                  ✓ Member account has been created. Please share these login credentials with the member.
                </p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Member Name</label>
                  <p className="text-white font-medium">{createdMemberInfo.name}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Email (Username)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white font-medium flex-1">{createdMemberInfo.email}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-700"
                      onClick={() => {
                        navigator.clipboard.writeText(createdMemberInfo.email);
                        toast({ title: 'Copied!', description: 'Email copied to clipboard' });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-yellow-400 font-mono text-sm bg-gray-900 p-2 rounded flex-1 break-all">
                      {createdMemberInfo.password}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-700"
                      onClick={() => {
                        navigator.clipboard.writeText(createdMemberInfo.password);
                        toast({ title: 'Copied!', description: 'Password copied to clipboard' });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-800 p-3 rounded-lg">
                <p className="text-yellow-400 text-xs">
                  ⚠️ <strong>Important:</strong> Save this password now! For security reasons, you won't be able to retrieve it later. The member can reset it using "Forgot Password" if needed.
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    setShowCredentialsDialog(false);
                    setCreatedMemberInfo(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  I've Saved the Credentials
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsList;
