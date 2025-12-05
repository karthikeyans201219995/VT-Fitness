import React, { useState, useEffect } from 'react';
import { balanceAPI, paymentsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Search, DollarSign, TrendingUp, AlertCircle, Loader2, Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const BalanceManagement = () => {
  const [membersWithBalance, setMembersWithBalance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, summaryData] = await Promise.all([
        balanceAPI.getMembersWithBalance(),
        balanceAPI.getSummary()
      ]);
      setMembersWithBalance(membersData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load balance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (member) => {
    setSelectedMember(member);
    setPaymentAmount('');
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedMember || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedMember.balance_due) {
      toast({
        title: 'Error',
        description: 'Payment amount cannot exceed balance due',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      await balanceAPI.recordPartialPayment({
        member_id: selectedMember.member_id,
        amount: amount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
        description: `Partial payment - ${selectedMember.member_name}`,
        status: 'completed',
        payment_type: amount >= selectedMember.balance_due ? 'balance_clearance' : 'partial',
        is_partial: amount < selectedMember.balance_due
      });

      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });

      setShowPaymentDialog(false);
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredMembers = membersWithBalance.filter(
    (member) =>
      member.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Balance Management</h1>
        <p className="text-gray-400">Track and manage member payment balances</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Due</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${summary.total_amount_due.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Paid</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${summary.total_amount_paid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Balance Due</CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${summary.total_balance_due.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Collection Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary.collection_rate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.member_id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{member.member_name}</h3>
                      <Badge className={member.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                        {member.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
                      <div className="text-gray-400">
                        <span className="font-medium">Email:</span> {member.email}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium">Plan:</span> {member.plan_name || 'N/A'}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium">Total Due:</span> ${member.total_amount_due.toFixed(2)}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium">Paid:</span> ${member.amount_paid.toFixed(2)}
                      </div>
                      <div className="text-orange-400 font-semibold">
                        <span className="font-medium">Balance:</span> ${member.balance_due.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRecordPayment(member)}
                    className="bg-blue-600 hover:bg-blue-700 ml-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {searchQuery ? 'No members found matching your search.' : 'No members with outstanding balance.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedMember.member_name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Due:</span>
                    <span className="text-white">${selectedMember.total_amount_due.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Already Paid:</span>
                    <span className="text-white">${selectedMember.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                    <span className="text-gray-400 font-semibold">Balance Due:</span>
                    <span className="text-orange-400 font-semibold">${selectedMember.balance_due.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-gray-800 border-gray-700 text-white"
                  max={selectedMember.balance_due}
                />
              </div>

              <div>
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BalanceManagement;
