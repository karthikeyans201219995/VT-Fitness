import React, { useState } from 'react';
import { mockMembers } from '../../mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Plus, Edit, Eye, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import AddMemberForm from './AddMemberForm';
import MemberDetails from './MemberDetails';

const MembersList = () => {
  const [members, setMembers] = useState(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = (newMember) => {
    setMembers([...members, { ...newMember, id: `M${members.length + 1}` }]);
    setShowAddDialog(false);
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Members Management</h1>
          <p className="text-gray-400">Manage gym members and their subscriptions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Member</DialogTitle>
              <DialogDescription className="text-gray-400">
                Fill in the member details below
              </DialogDescription>
            </DialogHeader>
            <AddMemberForm onSubmit={handleAddMember} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or email..."
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
                key={member.id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-600 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                      <Badge
                        className={member.status === 'active' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center text-gray-400">
                        <span className="font-medium text-gray-300 mr-2">ID:</span>
                        {member.memberId}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Mail className="mr-2 h-4 w-4" />
                        {member.email}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Phone className="mr-2 h-4 w-4" />
                        {member.phone}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        Plan: <span className="text-blue-400 font-medium">{member.plan}</span>
                      </span>
                      <span className="text-gray-400">
                        Valid Until: <span className="text-white font-medium">{member.validUntil}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-700"
                      onClick={() => handleViewDetails(member)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No members found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && <MemberDetails member={selectedMember} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersList;
