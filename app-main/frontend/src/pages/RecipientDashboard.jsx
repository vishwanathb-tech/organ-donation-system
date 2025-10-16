import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Heart, LogOut, User, Activity, Users } from 'lucide-react';
import { toast } from 'sonner';
import { API } from '@/App';

const organs = ['Heart', 'Kidney', 'Liver', 'Lungs', 'Pancreas', 'Intestines'];
const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const urgencyLevels = ['low', 'medium', 'high', 'critical'];

const RecipientDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [potentialDonors, setPotentialDonors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [formData, setFormData] = useState({
    blood_type: 'O+',
    age: '',
    organs_needed: [],
    urgency_level: 'medium',
    medical_history: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchPotentialMatches();
    fetchMatches();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/recipients/me`);
      setProfile(response.data);
      setFormData({
        blood_type: response.data.blood_type,
        age: response.data.age,
        organs_needed: response.data.organs_needed,
        urgency_level: response.data.urgency_level,
        medical_history: response.data.medical_history || ''
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setIsEditing(true);
      }
    }
  };

  const fetchPotentialMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches/potential`);
      setPotentialDonors(response.data);
    } catch (error) {
      console.error('Failed to fetch potential matches:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches`);
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (profile) {
        await axios.put(`${API}/recipients/me`, formData);
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`${API}/recipients`, formData);
        toast.success('Profile created successfully!');
      }
      setIsEditing(false);
      fetchProfile();
      fetchPotentialMatches();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    }
  };

  const toggleOrgan = (organ) => {
    const lowerOrgan = organ.toLowerCase();
    setFormData(prev => ({
      ...prev,
      organs_needed: prev.organs_needed.includes(lowerOrgan)
        ? prev.organs_needed.filter(o => o !== lowerOrgan)
        : [...prev.organs_needed, lowerOrgan]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">LifeLink</span>
              <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">Recipient</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">{user.name}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="border-gray-300"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card data-testid="recipient-profile-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Profile</span>
                  {profile && !isEditing && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      data-testid="edit-profile-btn"
                    >
                      Edit
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {profile ? 'Your recipient information' : 'Complete your profile to start'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Blood Type</Label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.blood_type}
                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                        required
                        data-testid="blood-type-select"
                      >
                        {bloodTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                        required
                        min="1"
                        max="100"
                        data-testid="age-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Organs Needed</Label>
                      <div className="space-y-2">
                        {organs.map(organ => (
                          <div key={organ} className="flex items-center space-x-2">
                            <Checkbox
                              id={organ}
                              checked={formData.organs_needed.includes(organ.toLowerCase())}
                              onCheckedChange={() => toggleOrgan(organ)}
                              data-testid={`organ-${organ.toLowerCase()}-checkbox`}
                            />
                            <label htmlFor={organ} className="text-sm cursor-pointer">
                              {organ}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Urgency Level</Label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.urgency_level}
                        onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                        required
                        data-testid="urgency-level-select"
                      >
                        {urgencyLevels.map(level => (
                          <option key={level} value={level} className="capitalize">{level}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Medical History (Optional)</Label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        value={formData.medical_history}
                        onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                        placeholder="Any relevant medical information..."
                        data-testid="medical-history-textarea"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        data-testid="save-profile-btn"
                      >
                        Save Profile
                      </Button>
                      {profile && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          data-testid="cancel-edit-btn"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                ) : profile ? (
                  <div className="space-y-4" data-testid="profile-display">
                    <div>
                      <p className="text-sm text-gray-500">Blood Type</p>
                      <p className="font-semibold text-lg">{profile.blood_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-semibold">{profile.age} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Organs Needed</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.organs_needed.map(organ => (
                          <Badge key={organ} className="bg-blue-100 text-blue-700 hover:bg-blue-100 capitalize">
                            {organ}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Urgency Level</p>
                      <Badge className={`
                        ${profile.urgency_level === 'critical' ? 'bg-red-100 text-red-700' : ''}
                        ${profile.urgency_level === 'high' ? 'bg-orange-100 text-orange-700' : ''}
                        ${profile.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${profile.urgency_level === 'low' ? 'bg-green-100 text-green-700' : ''}
                        hover:bg-current capitalize
                      `}>
                        {profile.urgency_level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 capitalize">
                        {profile.status}
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile?.organs_needed.length || 0}</p>
                      <p className="text-sm text-gray-600">Organs Needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{potentialDonors.length}</p>
                      <p className="text-sm text-gray-600">Potential Donors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{matches.length}</p>
                      <p className="text-sm text-gray-600">Active Matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Potential Donors */}
            <Card data-testid="potential-donors-card">
              <CardHeader>
                <CardTitle>Potential Donors</CardTitle>
                <CardDescription>Donors who match your blood type and organ needs</CardDescription>
              </CardHeader>
              <CardContent>
                {potentialDonors.length > 0 ? (
                  <div className="space-y-4">
                    {potentialDonors.map((donor) => (
                      <div key={donor.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                                Blood Type: {donor.blood_type}
                              </Badge>
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 capitalize">
                                {donor.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Age: {donor.age} years</p>
                            <div className="flex flex-wrap gap-1">
                              <span className="text-sm text-gray-500">Available:</span>
                              {donor.matching_organs?.map(organ => (
                                <Badge key={organ} variant="outline" className="text-xs capitalize">
                                  {organ}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">{donor.compatibility_score}% Match</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No potential donors found. Complete your profile to see matches.</p>
                )}
              </CardContent>
            </Card>

            {/* Active Matches */}
            {matches.length > 0 && (
              <Card data-testid="active-matches-card">
                <CardHeader>
                  <CardTitle>Active Matches</CardTitle>
                  <CardDescription>Your current matching processes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold capitalize">Organ: {match.organ_type}</p>
                            <p className="text-sm text-gray-600">Compatibility: {match.compatibility_score}%</p>
                          </div>
                          <Badge className={`
                            ${match.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${match.status === 'accepted' ? 'bg-green-100 text-green-700' : ''}
                            ${match.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                            hover:bg-current capitalize
                          `}>
                            {match.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecipientDashboard;