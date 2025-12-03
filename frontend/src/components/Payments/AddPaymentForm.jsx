import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockMembers, mockPlans } from '../../mockData';

const AddPaymentForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    plan: '',
    paymentMethod: '',
    status: 'paid',
    date: new Date().toISOString().split('T')[0],
    invoiceNo: `INV-2025-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMemberSelect = (memberId) => {
    const member = mockMembers.find(m => m.memberId === memberId);
    if (member) {
      setFormData({ 
        ...formData, 
        memberId: member.memberId,
        memberName: member.name,
        plan: member.plan
      });
    }
  };

  const handlePlanSelect = (planName) => {
    const plan = mockPlans.find(p => p.name === planName);
    if (plan) {
      setFormData({ ...formData, plan: planName, amount: plan.price });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
