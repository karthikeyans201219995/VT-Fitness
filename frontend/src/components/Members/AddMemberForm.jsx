import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockPlans } from '../../mockData';

const AddMemberForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    memberId: `GYM${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    plan: '',
    joinDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'active'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Member ID</Label>
          <Input
            name="memberId"
            value={formData.memberId}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Full Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Email</Label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Phone</Label>
          <Input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Age</Label>
          <Input
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Gender</Label>
          <Select onValueChange={(value) => handleSelectChange('gender', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Blood Group</Label>
          <Select onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Address</Label>
        <Input
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Emergency Contact</Label>
        <Input
          name="emergencyContact"
          type="tel"
          value={formData.emergencyContact}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Select Plan</Label>
          <Select onValueChange={(value) => handleSelectChange('plan', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Choose plan" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {mockPlans.map(plan => (
                <SelectItem key={plan.id} value={plan.name}>{plan.name} - ${plan.price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Valid Until</Label>
          <Input
            name="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-700 text-white hover:bg-gray-700">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          Add Member
        </Button>
      </div>
    </form>
  );
};

export default AddMemberForm;
