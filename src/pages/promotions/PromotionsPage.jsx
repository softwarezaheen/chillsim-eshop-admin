import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Tabs, Tab, Box, Typography, Backdrop, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import PromotionCodesTab from './PromotionCodesTab';
import PromotionUsagesTab from './PromotionUsagesTab';
import PromotionRulesTab from './PromotionRulesTab';
import AddPromotionDialog from './AddPromotionDialog';
import AddEditRuleDialog from './AddEditRuleDialog';
import BulkGeneratePromoModal from '../../Components/Modals/BulkGeneratePromoModal';
import BulkEditValidityModal from './BulkEditValidityModal';
import EditPromotionModal from './EditPromotionModal';
import {
  getPromotions,
  getPromotionUsages,
  addPromotion,
  getPromotionRuleActions,
  getPromotionRuleEvents,
  getPromotionRules,
  addPromotionRule,
  updatePromotionRule,
  deletePromotionRule,
  expirePromotion,
  exportPromoCodesCsv,
  bulkExpirePromotions,
  bulkEditValidity,
  editPromotion,
} from '../../core/apis/promotionsAPI';

const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false);
  const [bulkEditValidityOpen, setBulkEditValidityOpen] = useState(false);
  const [editPromotionOpen, setEditPromotionOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [formData, setFormData] = useState({
    rule_id: '',
    code: '',
    bundle_code: '',
    type: 'PROMOTION',
    name: '',
    amount: '',
    callback_url: '',
    callback_headers: '',
    valid_from: null,
    valid_to: null,
    is_active: true,
  });
  const [ruleActions, setRuleActions] = useState([]);
  const [ruleEvents, setRuleEvents] = useState([]);
  const [promotionRules, setPromotionRules] = useState([]);
  const [rules, setRules] = useState([]);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleFormData, setRuleFormData] = useState({
    promotion_rule_action_id: '',
    promotion_rule_event_id: '',
    max_usage: 1,
    beneficiary: 0,
    rule_description: '',
  });

  useEffect(() => {
    fetchRuleActions();
    fetchRuleEvents();
    fetchPromotionRules();
  }, []);

  const fetchPromotionsWithFilters = useCallback(async (filters) => {
    setLoading(true);
    setCurrentFilters(filters);
    const processedFilters = { ...filters };
    if (processedFilters.valid_from) {
      processedFilters.valid_from = new Date(processedFilters.valid_from).toISOString().split('T')[0];
    }
    if (processedFilters.valid_to) {
      processedFilters.valid_to = new Date(processedFilters.valid_to).toISOString().split('T')[0];
    }
    if (processedFilters.created_from) {
      processedFilters.created_from = new Date(processedFilters.created_from).toISOString();
    }
    if (processedFilters.created_to) {
      processedFilters.created_to = new Date(processedFilters.created_to).toISOString();
    }
    
    const { data, error, count } = await getPromotions(processedFilters, page, pageSize);
    if (error) {
      toast.error('Failed to fetch promotions');
    } else {
      setPromotions(data || []);
      setTotalRows(count || 0);
    }
    setLoading(false);
  }, [page, pageSize]);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getPromotionRules();
    if (error) {
      toast.error('Failed to fetch promotion rules');
    } else {
      setRules(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      const fetchData = async () => {
        setLoading(true);
        const { data, error, count } = await getPromotionUsages({}, page, pageSize);
        if (error) {
          toast.error('Failed to fetch promotion usages');
        } else {
          setUsages(data || []);
          setTotalRows(count || 0);
        }
        setLoading(false);
      };
      fetchData();
    } else if (activeTab === 2) {
      const fetchData = async () => {
        setLoading(true);
        const { data, error } = await getPromotionRules();
        if (error) {
          toast.error('Failed to fetch promotion rules');
        } else {
          setRules(data || []);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [activeTab, page, pageSize]);

  const fetchRuleActions = async () => {
    const { data, error } = await getPromotionRuleActions();
    if (!error) {
      setRuleActions(data || []);
    }
  };

  const fetchRuleEvents = async () => {
    const { data, error } = await getPromotionRuleEvents();
    if (!error) {
      setRuleEvents(data || []);
    }
  };

  const fetchPromotionRules = async () => {
    const { data, error } = await getPromotionRules();
    if (!error) {
      setPromotionRules(data || []);
    }
  };

  const handleAddPromotion = async () => {
    // Validation
    if (!formData.rule_id) {
      toast.error('Please select a rule');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Please enter a promotion code');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    const { data, error } = await addPromotion(formData);
    if (error) {
      toast.error('Failed to add promotion');
    } else {
      toast.success('Promotion added successfully');
      setAddDialogOpen(false);
      setFormData({
        rule_id: '',
        code: '',
        bundle_code: '',
        type: 'PROMOTION',
        name: '',
        amount: '',
        callback_url: '',
        callback_headers: '',
        valid_from: null,
        valid_to: null,
        is_active: true,
      });
      fetchPromotionsWithFilters(currentFilters);
    }
  };

  const handleAddRule = async () => {
    const { data, error } = await addPromotionRule(ruleFormData);
    if (error) {
      toast.error('Failed to add promotion rule');
    } else {
      toast.success('Promotion rule added successfully');
      setRuleDialogOpen(false);
      setRuleFormData({
        promotion_rule_action_id: '',
        promotion_rule_event_id: '',
        max_usage: 1,
        beneficiary: 0,
        rule_description: '',
      });
      fetchRules();
      fetchPromotionRules(); // Reload promotion rules for the add promotion dialog
    }
  };

  const handleEditRule = async () => {
    const { data, error } = await updatePromotionRule(editingRule.id, ruleFormData);
    if (error) {
      toast.error('Failed to update promotion rule');
    } else {
      toast.success('Promotion rule updated successfully');
      setRuleDialogOpen(false);
      setEditingRule(null);
      setRuleFormData({
        promotion_rule_action_id: '',
        promotion_rule_event_id: '',
        max_usage: 1,
        beneficiary: 0,
        rule_description: '',
      });
      fetchRules();
      fetchPromotionRules(); // Reload promotion rules for the add promotion dialog
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion rule?')) {
      const { error } = await deletePromotionRule(id);
      if (error) {
        toast.error('Failed to delete promotion rule');
      } else {
        toast.success('Promotion rule deleted successfully');
        fetchRules();
        fetchPromotionRules(); // Reload promotion rules for the add promotion dialog
      }
    }
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setRuleFormData({
      promotion_rule_action_id: rule.promotion_rule_action_id,
      promotion_rule_event_id: rule.promotion_rule_event_id,
      max_usage: rule.max_usage,
      beneficiary: rule.beneficiary,
      rule_description: rule.rule_description || '',
    });
    setRuleDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingRule(null);
    setRuleFormData({
      promotion_rule_action_id: '',
      promotion_rule_event_id: '',
      max_usage: 1,
      beneficiary: 0,
      rule_description: '',
    });
    setRuleDialogOpen(true);
  };

  const openAddPromotionDialog = async () => {
    await fetchPromotionRules();
    setAddDialogOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpirePromotion = async (code) => {
    if (window.confirm(`Are you sure you want to expire promotion code "${code}"?`)) {
      const { error } = await expirePromotion(code);
      if (error) {
        toast.error('Failed to expire promotion');
      } else {
        toast.success('Promotion expired successfully');
        fetchPromotionsWithFilters(currentFilters);
      }
    }
  };

  const handleBulkGenerate = () => {
    setBulkGenerateOpen(true);
  };

  const handleBulkGenerateSuccess = () => {
    toast.success('Promo codes generated successfully!');
    fetchPromotionsWithFilters(currentFilters);
  };

  const handleExportCsv = async (filters) => {
    setBulkOperationLoading(true);
    try {
      const processedFilters = { ...filters };
      if (processedFilters.valid_from) {
        processedFilters.valid_from = new Date(processedFilters.valid_from).toISOString();
      }
      if (processedFilters.valid_to) {
        processedFilters.valid_to = new Date(processedFilters.valid_to).toISOString();
      }
      if (processedFilters.created_from) {
        processedFilters.created_from = new Date(processedFilters.created_from).toISOString();
      }
      if (processedFilters.created_to) {
        processedFilters.created_to = new Date(processedFilters.created_to).toISOString();
      }
      
      await exportPromoCodesCsv(processedFilters);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error(`Failed to export CSV: ${error.message}`);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkExpire = async (filters) => {
    if (selectedPromotions.length === 0 && !selectAll) {
      toast.error('No promotions selected');
      return;
    }

    const count = selectAll ? totalRows : selectedPromotions.length;
    
    if (!window.confirm(`Are you sure you want to expire ${count} promotion(s)?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      let result;
      if (selectAll) {
        const processedFilters = { ...filters };
        if (processedFilters.valid_from) {
          processedFilters.valid_from = new Date(processedFilters.valid_from).toISOString().split('T')[0];
        }
        if (processedFilters.valid_to) {
          processedFilters.valid_to = new Date(processedFilters.valid_to).toISOString().split('T')[0];
        }
        if (processedFilters.created_from) {
          processedFilters.created_from = new Date(processedFilters.created_from).toISOString();
        }
        if (processedFilters.created_to) {
          processedFilters.created_to = new Date(processedFilters.created_to).toISOString();
        }
        result = await bulkExpirePromotions(null, processedFilters);
      } else {
        result = await bulkExpirePromotions(selectedPromotions);
      }
      
      toast.success(`Successfully expired ${result.data.expired_count} promotion(s)`);
      setSelectedPromotions([]);
      setSelectAll(false);
      fetchPromotionsWithFilters(currentFilters);
    } catch (error) {
      toast.error(`Failed to expire promotions: ${error.message}`);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkEditValiditySubmit = async (validFrom, validTo, filters) => {
    if (selectedPromotions.length === 0 && !selectAll) {
      toast.error('No promotions selected');
      return;
    }

    setBulkOperationLoading(true);
    try {
      let adjustedValidFrom = null;
      let adjustedValidTo = null;
      
      if (validFrom) {
        const fromDate = new Date(validFrom);
        fromDate.setHours(0, 0, 0, 0);
        adjustedValidFrom = fromDate.toISOString();
      }
      
      if (validTo) {
        const toDate = new Date(validTo);
        toDate.setHours(23, 59, 59, 999);
        adjustedValidTo = toDate.toISOString();
      }

      let result;
      if (selectAll) {
        const filterRequest = {
          filter_code: filters.code,
          filter_is_active: filters.is_active,
          filter_promo_type: filters.promo_type,
        };
        
        if (filters.valid_from) {
          filterRequest.filter_valid_from = new Date(filters.valid_from).toISOString().split('T')[0];
        }
        if (filters.valid_to) {
          filterRequest.filter_valid_to = new Date(filters.valid_to).toISOString().split('T')[0];
        }
        if (filters.created_from) {
          filterRequest.filter_created_from = new Date(filters.created_from).toISOString();
        }
        if (filters.created_to) {
          filterRequest.filter_created_to = new Date(filters.created_to).toISOString();
        }
        
        result = await bulkEditValidity(null, adjustedValidFrom, adjustedValidTo, filterRequest);
      } else {
        result = await bulkEditValidity(selectedPromotions, adjustedValidFrom, adjustedValidTo);
      }
      
      toast.success(`Successfully updated ${result.data.updated_count} promotion(s)`);
      setSelectedPromotions([]);
      setSelectAll(false);
      fetchPromotionsWithFilters(currentFilters);
    } catch (error) {
      toast.error(`Failed to update validity dates: ${error.message}`);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleEditPromotionSubmit = async (updates) => {
    if (!selectedPromotion) {
      return;
    }

    try {
      const adjustedUpdates = { ...updates };
      
      if (adjustedUpdates.valid_from) {
        const fromDate = new Date(adjustedUpdates.valid_from);
        fromDate.setHours(0, 0, 0, 0);
        adjustedUpdates.valid_from = fromDate.toISOString();
      }
      
      if (adjustedUpdates.valid_to) {
        const toDate = new Date(adjustedUpdates.valid_to);
        toDate.setHours(23, 59, 59, 999);
        adjustedUpdates.valid_to = toDate.toISOString();
      }

      await editPromotion(selectedPromotion.id, adjustedUpdates);
      toast.success('Promotion updated successfully');
      setSelectedPromotion(null);
      fetchPromotionsWithFilters(currentFilters);
    } catch (error) {
      toast.error(`Failed to update promotion: ${error.message}`);
    }
  };

  const handleEditPromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setEditPromotionOpen(true);
  };

  return (
    <Card className="page-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography variant="h4">Promotions</Typography>
        <div />
      </div>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label="promotion tabs">
        <Tab label="Promotion Codes" />
        <Tab label="Promotion Usages" />
        <Tab label="Promotion Rules" />
      </Tabs>

      <Box sx={{ p: 3 }}>
        {activeTab === 0 && (
          <PromotionCodesTab
            promotions={promotions}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalRows={totalRows}
            setPage={setPage}
            setPageSize={setPageSize}
            handlePageChange={handlePageChange}
            handlePageSizeChange={handlePageSizeChange}
            onFetchPromotions={fetchPromotionsWithFilters}
            onAddPromotion={() => setAddDialogOpen(true)}
            onExpirePromotion={handleExpirePromotion}
            onBulkGenerate={handleBulkGenerate}
            onExportCsv={handleExportCsv}
            selectedPromotions={selectedPromotions}
            setSelectedPromotions={setSelectedPromotions}
            selectAll={selectAll}
            setSelectAll={setSelectAll}
            onBulkExpire={handleBulkExpire}
            onBulkEditValidity={(filters) => {
              setCurrentFilters(filters);
              setBulkEditValidityOpen(true);
            }}
            onEditPromotion={handleEditPromotion}
          />
        )}

        {activeTab === 1 && (
          <PromotionUsagesTab
            usages={usages}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalRows={totalRows}
            setPage={setPage}
            setPageSize={setPageSize}
            handlePageChange={handlePageChange}
            handlePageSizeChange={handlePageSizeChange}
          />
        )}

        {activeTab === 2 && (
          <PromotionRulesTab
            rules={rules}
            loading={loading}
            onAddRule={openAddDialog}
            onEditRule={openEditDialog}
            onDeleteRule={handleDeleteRule}
          />
        )}
      </Box>

      <AddPromotionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        promotionRules={promotionRules}
        onSubmit={handleAddPromotion}
      />

      <AddEditRuleDialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        formData={ruleFormData}
        setFormData={setRuleFormData}
        ruleActions={ruleActions}
        ruleEvents={ruleEvents}
        editingRule={editingRule}
        onSubmit={editingRule ? handleEditRule : handleAddRule}
      />

      <BulkGeneratePromoModal
        open={bulkGenerateOpen}
        onClose={() => setBulkGenerateOpen(false)}
        onSuccess={handleBulkGenerateSuccess}
      />

      <BulkEditValidityModal
        open={bulkEditValidityOpen}
        onClose={() => setBulkEditValidityOpen(false)}
        onSubmit={(validFrom, validTo) => handleBulkEditValiditySubmit(validFrom, validTo, currentFilters)}
        selectedCount={selectAll ? totalRows : selectedPromotions.length}
      />

      <EditPromotionModal
        open={editPromotionOpen}
        onClose={() => {
          setEditPromotionOpen(false);
          setSelectedPromotion(null);
        }}
        onSubmit={handleEditPromotionSubmit}
        promotion={selectedPromotion}
      />

      {/* Loading Overlay for Bulk Operations */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
        open={bulkOperationLoading}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Processing bulk operation...
        </Typography>
        <Typography variant="body2" color="inherit">
          This may take a moment for large datasets
        </Typography>
      </Backdrop>
    </Card>
  );
};

export default PromotionsPage;