import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { membersAPI, plansAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

const AddPaymentForm = ({ onSubmit, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    member_id: '',
    plan_id: '',
    amount: '',
    payment_method: '',
    status: 'paid',
    payment_date: new Date().toISOString().split('T')[0],
    invoice_number: `INV-2025-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, plansData] = await Promise.all([
        membersAPI.getAll(),
        plansAPI.getAll()
      ]);
      setMembers(membersData || []);
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (member && member.plan_id) {
      const plan = plans.find(p => p.id === member.plan_id);
      if (plan) {
        setFormData({ 
          ...formData, 
          member_id: memberId,
          plan_id: plan.id,
          amount: plan.price.toString()
        });
      }
    } else {
      setFormData({ ...formData, member_id: memberId });
    }
  };

  const handlePlanSelect = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setFormData({ ...formData, plan_id: planId, amount: plan.price.toString() });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-300">Select Member</Label>
        <Select onValueChange={handleMemberSelect}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Choose member" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {mockMembers.map(member => (
              <SelectItem key={member.id} value={member.memberId}>
                {member.name} ({member.memberId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Select Plan</Label>
        <Select onValueChange={handlePlanSelect}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Choose plan" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {mockPlans.map(plan => (
              <SelectItem key={plan.id} value={plan.name}>
                {plan.name} - ${plan.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Amount</Label>
          <Input
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Payment Date</Label>
          <Input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Payment Method</Label>
        <Select onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Credit Card">Credit Card</SelectItem>
            <SelectItem value="Debit Card">Debit Card</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Invoice Number</Label>
        <Input
          name="invoiceNo"
          value={formData.invoiceNo}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          required
          readOnly
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-700 text-white hover:bg-gray-700">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          Record Payment
        </Button>
      </div>
    </form>
  );
};

export default AddPaymentForm;
