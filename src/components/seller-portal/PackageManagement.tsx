import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, Clock, Wifi, DollarSign } from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  verified: boolean;
  status: string;
}

interface PackageItem {
  id: string;
  hotspot_id: string;
  title: string;
  price: number;
  duration_minutes: number | null;
  data_mb: number | null;
  max_concurrent: number;
  active: boolean;
  created_at: string;
  hotspots?: Hotspot;
}

interface PackageManagementProps {
  sellerId: string;
}

export function PackageManagement({ sellerId }: PackageManagementProps) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  
  const [formData, setFormData] = useState({
    hotspot_id: '',
    title: '',
    price: '',
    duration_minutes: '',
    data_mb: '',
    max_concurrent: '10',
    package_type: 'time' as 'time' | 'data',
  });

  useEffect(() => {
    fetchData();
  }, [sellerId]);

  const fetchData = async () => {
    try {
      // Fetch hotspots
      const { data: hotspotsData, error: hotspotsError } = await supabase
        .from('hotspots')
        .select('id, name, verified, status')
        .eq('seller_id', sellerId)
        .eq('verified', true)
        .eq('status', 'active');

      if (hotspotsError) throw hotspotsError;
      setHotspots(hotspotsData || []);

      // Fetch packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select(`
          *,
          hotspots!packages_hotspot_id_fkey (
            id, name, verified, status
          )
        `)
        .in('hotspot_id', (hotspotsData || []).map(h => h.id))
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load packages and hotspots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      hotspot_id: '',
      title: '',
      price: '',
      duration_minutes: '',
      data_mb: '',
      max_concurrent: '10',
      package_type: 'time',
    });
    setEditingPackage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const packageData = {
        hotspot_id: formData.hotspot_id,
        title: formData.title,
        price: parseInt(formData.price) * 100, // Convert to cents
        duration_minutes: formData.package_type === 'time' ? parseInt(formData.duration_minutes) : null,
        data_mb: formData.package_type === 'data' ? parseInt(formData.data_mb) : null,
        max_concurrent: parseInt(formData.max_concurrent),
        active: true,
      };

      let result;
      if (editingPackage) {
        result = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('packages')
          .insert(packageData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Package ${editingPackage ? 'updated' : 'created'} successfully`,
      });

      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save package",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setFormData({
      hotspot_id: pkg.hotspot_id,
      title: pkg.title,
      price: (pkg.price / 100).toString(),
      duration_minutes: pkg.duration_minutes?.toString() || '',
      data_mb: pkg.data_mb?.toString() || '',
      max_concurrent: pkg.max_concurrent.toString(),
      package_type: pkg.duration_minutes ? 'time' : 'data',
    });
    setShowAddModal(true);
  };

  const togglePackageStatus = async (pkg: PackageItem) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ active: !pkg.active })
        .eq('id', pkg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Package ${pkg.active ? 'disabled' : 'enabled'} successfully`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error toggling package status:', error);
      toast({
        title: "Error",
        description: "Failed to update package status",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `KES ${(priceInCents / 100).toFixed(0)}`;
  };

  const formatDuration = (pkg: PackageItem) => {
    if (pkg.duration_minutes) {
      const hours = Math.floor(pkg.duration_minutes / 60);
      const minutes = pkg.duration_minutes % 60;
      if (hours > 0) {
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
      }
      return `${minutes}m`;
    }
    if (pkg.data_mb) {
      if (pkg.data_mb >= 1024) {
        return `${(pkg.data_mb / 1024).toFixed(1)}GB`;
      }
      return `${pkg.data_mb}MB`;
    }
    return 'Unlimited';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hotspots.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Verified Hotspots</h3>
        <p className="text-muted-foreground">
          You need at least one verified and active hotspot before you can create packages.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Package Management</h2>
          <p className="text-muted-foreground">Create and manage Wi-Fi packages for your hotspots</p>
        </div>
        
        <Dialog open={showAddModal} onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Package</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotspot_id">Hotspot *</Label>
                <Select 
                  value={formData.hotspot_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, hotspot_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hotspot" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotspots.map((hotspot) => (
                      <SelectItem key={hotspot.id} value={hotspot.id}>
                        {hotspot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Package Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., 1 Hour Access"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Package Type</Label>
                <Select 
                  value={formData.package_type} 
                  onValueChange={(value: 'time' | 'data') => setFormData(prev => ({ 
                    ...prev, 
                    package_type: value,
                    duration_minutes: value === 'data' ? '' : prev.duration_minutes,
                    data_mb: value === 'time' ? '' : prev.data_mb,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="data">Data-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.package_type === 'time' && (
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="60"
                    required
                  />
                </div>
              )}

              {formData.package_type === 'data' && (
                <div className="space-y-2">
                  <Label htmlFor="data_mb">Data Limit (MB) *</Label>
                  <Input
                    id="data_mb"
                    type="number"
                    min="1"
                    value={formData.data_mb}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_mb: e.target.value }))}
                    placeholder="1024"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="max_concurrent">Max Concurrent Users</Label>
                <Input
                  id="max_concurrent"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_concurrent}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingPackage ? 'Update Package' : 'Create Package'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {packages.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Packages Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first package to start selling Wi-Fi access
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Package
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pkg.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pkg.hotspots?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={pkg.active}
                    onCheckedChange={() => togglePackageStatus(pkg)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(pkg.price)}
                  </span>
                  <Badge variant={pkg.active ? "default" : "secondary"}>
                    {pkg.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(pkg)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Max {pkg.max_concurrent} concurrent users</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(pkg.created_at).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}