export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          initial_balance: number
          is_default: boolean
          name: string
          project_id: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          initial_balance?: number
          is_default?: boolean
          name: string
          project_id: string
          type?: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          created_at?: string
          id?: string
          initial_balance?: number
          is_default?: boolean
          name?: string
          project_id?: string
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_allocations: {
        Row: {
          allocated_amount: number
          bill_line_id: string
          created_at: string
          id: string
          payment_line_id: string
        }
        Insert: {
          allocated_amount: number
          bill_line_id: string
          created_at?: string
          id?: string
          payment_line_id: string
        }
        Update: {
          allocated_amount?: number
          bill_line_id?: string
          created_at?: string
          id?: string
          payment_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_allocations_bill_line_id_fkey"
            columns: ["bill_line_id"]
            isOneToOne: false
            referencedRelation: "voucher_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_allocations_payment_line_id_fkey"
            columns: ["payment_line_id"]
            isOneToOne: false
            referencedRelation: "voucher_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          direction: string | null
          display_name: string | null
          id: string
          name: string | null
          number: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          direction?: string | null
          display_name?: string | null
          id?: string
          name?: string | null
          number?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          direction?: string | null
          display_name?: string | null
          id?: string
          name?: string | null
          number?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_closed: boolean
          project_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_closed?: boolean
          project_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_closed?: boolean
          project_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      food_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_category: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_category?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_category?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      food_records: {
        Row: {
          amount: number | null
          comments: string | null
          created_at: string
          end_date: string
          food_category_id: string
          id: string
          project_id: string
          quantity: number | null
          shop_id: string | null
          start_date: string
          unit: string | null
          worker_id: string | null
          worker_type_id: string | null
        }
        Insert: {
          amount?: number | null
          comments?: string | null
          created_at?: string
          end_date: string
          food_category_id: string
          id?: string
          project_id: string
          quantity?: number | null
          shop_id?: string | null
          start_date: string
          unit?: string | null
          worker_id?: string | null
          worker_type_id?: string | null
        }
        Update: {
          amount?: number | null
          comments?: string | null
          created_at?: string
          end_date?: string
          food_category_id?: string
          id?: string
          project_id?: string
          quantity?: number | null
          shop_id?: string | null
          start_date?: string
          unit?: string | null
          worker_id?: string | null
          worker_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_records_food_category_id_fkey"
            columns: ["food_category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_records_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_records_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_records_worker_type_id_fkey"
            columns: ["worker_type_id"]
            isOneToOne: false
            referencedRelation: "worker_types"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          amount: number | null
          building_id: string | null
          comments: string | null
          created_at: string
          current_meter: number | null
          date: string
          fuel_type: string
          id: string
          machine_id: string
          previous_meter: number | null
          project_id: string
          provider_id: string | null
          quantity: number
          rate: number | null
          unit: string | null
        }
        Insert: {
          amount?: number | null
          building_id?: string | null
          comments?: string | null
          created_at?: string
          current_meter?: number | null
          date: string
          fuel_type: string
          id?: string
          machine_id: string
          previous_meter?: number | null
          project_id: string
          provider_id?: string | null
          quantity: number
          rate?: number | null
          unit?: string | null
        }
        Update: {
          amount?: number | null
          building_id?: string | null
          comments?: string | null
          created_at?: string
          current_meter?: number | null
          date?: string
          fuel_type?: string
          id?: string
          machine_id?: string
          previous_meter?: number | null
          project_id?: string
          provider_id?: string | null
          quantity?: number
          rate?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_records_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machinery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      general_site_expenses: {
        Row: {
          amount: number
          comments: string | null
          created_at: string
          date: string
          expense_category: string
          id: string
          paid_to_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
        }
        Insert: {
          amount: number
          comments?: string | null
          created_at?: string
          date: string
          expense_category: string
          id?: string
          paid_to_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
        }
        Update: {
          amount?: number
          comments?: string | null
          created_at?: string
          date?: string
          expense_category?: string
          id?: string
          paid_to_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_site_expenses_paid_to_id_fkey"
            columns: ["paid_to_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_site_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      general_store_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_store_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      general_store_items: {
        Row: {
          category_id: string
          created_at: string
          default_unit: string | null
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          default_unit?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          default_unit?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_store_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "general_store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      general_store_records: {
        Row: {
          amount: number | null
          comments: string | null
          created_at: string
          date: string
          id: string
          item_id: string
          project_id: string
          quantity: number | null
          shop_id: string | null
          unit: string | null
        }
        Insert: {
          amount?: number | null
          comments?: string | null
          created_at?: string
          date: string
          id?: string
          item_id: string
          project_id: string
          quantity?: number | null
          shop_id?: string | null
          unit?: string | null
        }
        Update: {
          amount?: number | null
          comments?: string | null
          created_at?: string
          date?: string
          id?: string
          item_id?: string
          project_id?: string
          quantity?: number | null
          shop_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_store_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "general_store_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_store_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_store_records_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_records: {
        Row: {
          amount: number | null
          building_id: string | null
          cash_provider_id: string | null
          comments: string | null
          created_at: string
          date: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          time: string | null
          work_type_id: string | null
          worker_id: string
          worker_type_id: string | null
        }
        Insert: {
          amount?: number | null
          building_id?: string | null
          cash_provider_id?: string | null
          comments?: string | null
          created_at?: string
          date: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          time?: string | null
          work_type_id?: string | null
          worker_id: string
          worker_type_id?: string | null
        }
        Update: {
          amount?: number | null
          building_id?: string | null
          cash_provider_id?: string | null
          comments?: string | null
          created_at?: string
          date?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string
          time?: string | null
          work_type_id?: string | null
          worker_id?: string
          worker_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labour_records_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_records_cash_provider_id_fkey"
            columns: ["cash_provider_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_records_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_records_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_records_worker_type_id_fkey"
            columns: ["worker_type_id"]
            isOneToOne: false
            referencedRelation: "worker_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_group: Database["public"]["Enums"]["account_group"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          normal_balance: string | null
          project_id: string
        }
        Insert: {
          account_group: Database["public"]["Enums"]["account_group"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          normal_balance?: string | null
          project_id: string
        }
        Update: {
          account_group?: Database["public"]["Enums"]["account_group"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          normal_balance?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      machinery: {
        Row: {
          created_at: string
          fuel_type: string | null
          id: string
          is_active: boolean
          machine_id: string
          machine_type: string
          meter_type: string | null
          operator_id: string | null
          project_id: string
          registration_number: string | null
        }
        Insert: {
          created_at?: string
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          machine_id: string
          machine_type: string
          meter_type?: string | null
          operator_id?: string | null
          project_id: string
          registration_number?: string | null
        }
        Update: {
          created_at?: string
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          machine_id?: string
          machine_type?: string
          meter_type?: string | null
          operator_id?: string | null
          project_id?: string
          registration_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machinery_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      machinery_records: {
        Row: {
          amount: number | null
          building_id: string | null
          charging_type: string | null
          comments: string | null
          created_at: string
          date: string
          end_time: string | null
          hours: number | null
          id: string
          machine_id: string
          operator_id: string | null
          project_id: string
          start_time: string | null
        }
        Insert: {
          amount?: number | null
          building_id?: string | null
          charging_type?: string | null
          comments?: string | null
          created_at?: string
          date: string
          end_time?: string | null
          hours?: number | null
          id?: string
          machine_id: string
          operator_id?: string | null
          project_id: string
          start_time?: string | null
        }
        Update: {
          amount?: number | null
          building_id?: string | null
          charging_type?: string | null
          comments?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          hours?: number | null
          id?: string
          machine_id?: string
          operator_id?: string | null
          project_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machinery_records_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machinery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_records_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_deliveries: {
        Row: {
          building_id: string | null
          comments: string | null
          created_at: string
          date: string
          id: string
          material_cost: number | null
          material_id: string
          project_id: string
          quantity: number | null
          supplier_id: string | null
          time: string | null
          unit: string | null
          variant_id: string | null
        }
        Insert: {
          building_id?: string | null
          comments?: string | null
          created_at?: string
          date: string
          id?: string
          material_cost?: number | null
          material_id: string
          project_id: string
          quantity?: number | null
          supplier_id?: string | null
          time?: string | null
          unit?: string | null
          variant_id?: string | null
        }
        Update: {
          building_id?: string | null
          comments?: string | null
          created_at?: string
          date?: string
          id?: string
          material_cost?: number | null
          material_id?: string
          project_id?: string
          quantity?: number | null
          supplier_id?: string | null
          time?: string | null
          unit?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_deliveries_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_deliveries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_deliveries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_deliveries_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "material_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      material_variants: {
        Row: {
          created_at: string
          id: string
          material_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_variants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          class: Database["public"]["Enums"]["material_class"]
          created_at: string
          default_unit: string | null
          id: string
          name: string
          project_id: string
        }
        Insert: {
          class?: Database["public"]["Enums"]["material_class"]
          created_at?: string
          default_unit?: string | null
          id?: string
          name: string
          project_id: string
        }
        Update: {
          class?: Database["public"]["Enums"]["material_class"]
          created_at?: string
          default_unit?: string | null
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          class: Database["public"]["Enums"]["party_class"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          project_id: string
          role: string | null
          worker_type_id: string | null
        }
        Insert: {
          class: Database["public"]["Enums"]["party_class"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          project_id: string
          role?: string | null
          worker_type_id?: string | null
        }
        Update: {
          class?: Database["public"]["Enums"]["party_class"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          project_id?: string
          role?: string | null
          worker_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_worker_type_id_fkey"
            columns: ["worker_type_id"]
            isOneToOne: false
            referencedRelation: "worker_types"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          amount: number
          cash_provider_id: string | null
          comments: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          project_id: string
          start_date: string
          worker_type_id: string | null
        }
        Insert: {
          amount: number
          cash_provider_id?: string | null
          comments?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          project_id: string
          start_date: string
          worker_type_id?: string | null
        }
        Update: {
          amount?: number
          cash_provider_id?: string | null
          comments?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          project_id?: string
          start_date?: string
          worker_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_cash_provider_id_fkey"
            columns: ["cash_provider_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_worker_type_id_fkey"
            columns: ["worker_type_id"]
            isOneToOne: false
            referencedRelation: "worker_types"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          party_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          project_id: string
          reference_id: string | null
          reference_table: string | null
          to_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          party_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          project_id: string
          reference_id?: string | null
          reference_table?: string | null
          to_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          party_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          project_id?: string
          reference_id?: string | null
          reference_table?: string | null
          to_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_records: {
        Row: {
          amount: number | null
          created_at: string
          delivery_id: string
          id: string
          source_location: string | null
          transport_type: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          delivery_id: string
          id?: string
          source_location?: string | null
          transport_type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          delivery_id?: string
          id?: string
          source_location?: string | null
          transport_type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_records_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "material_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_vehicles: {
        Row: {
          capacity: string | null
          created_at: string
          driver_id: string | null
          id: string
          notes: string | null
          owner_id: string | null
          project_id: string
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          capacity?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          project_id: string
          vehicle_number: string
          vehicle_type: string
        }
        Update: {
          capacity?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          project_id?: string
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_vehicles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_lines: {
        Row: {
          cost_center_id: string | null
          created_at: string
          credit: number
          debit: number
          due_date: string | null
          id: string
          ledger_id: string
          party_id: string | null
          voucher_id: string
        }
        Insert: {
          cost_center_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          due_date?: string | null
          id?: string
          ledger_id: string
          party_id?: string | null
          voucher_id: string
        }
        Update: {
          cost_center_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          due_date?: string | null
          id?: string
          ledger_id?: string
          party_id?: string | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_lines_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_lines_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_lines_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          created_at: string
          date: string
          id: string
          is_reversed: boolean
          narration: string | null
          project_id: string
          reference_id: string | null
          reference_table: string | null
          reversed_by_id: string | null
          type: Database["public"]["Enums"]["voucher_type"]
          voucher_no: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_reversed?: boolean
          narration?: string | null
          project_id: string
          reference_id?: string | null
          reference_table?: string | null
          reversed_by_id?: string | null
          type: Database["public"]["Enums"]["voucher_type"]
          voucher_no: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_reversed?: boolean
          narration?: string | null
          project_id?: string
          reference_id?: string | null
          reference_table?: string | null
          reversed_by_id?: string | null
          type?: Database["public"]["Enums"]["voucher_type"]
          voucher_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weighbridge_records: {
        Row: {
          created_at: string
          delivery_id: string
          fee: number | null
          gross_weight: number | null
          id: string
          net_weight: number | null
          tare_weight: number | null
          weighbridge_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_id: string
          fee?: number | null
          gross_weight?: number | null
          id?: string
          net_weight?: number | null
          tare_weight?: number | null
          weighbridge_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_id?: string
          fee?: number | null
          gross_weight?: number | null
          id?: string
          net_weight?: number | null
          tare_weight?: number | null
          weighbridge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weighbridge_records_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "material_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weighbridge_records_weighbridge_id_fkey"
            columns: ["weighbridge_id"]
            isOneToOne: false
            referencedRelation: "weighbridges"
            referencedColumns: ["id"]
          },
        ]
      }
      weighbridges: {
        Row: {
          created_at: string
          default_fee: number | null
          id: string
          location: string | null
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          default_fee?: number | null
          id?: string
          location?: string | null
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          default_fee?: number | null
          id?: string
          location?: string | null
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weighbridges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_types: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_types_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_types: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_types_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      post_voucher: {
        Args: {
          p_date: string
          p_lines: Json
          p_narration: string
          p_project_id: string
          p_reference_id: string
          p_reference_table: string
          p_type: Database["public"]["Enums"]["voucher_type"]
          p_voucher_no: string
        }
        Returns: string
      }
    }
    Enums: {
      account_group: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
      account_type: "cash" | "bank" | "upi" | "other"
      material_class:
        | "bulk"
        | "hardware"
        | "electrical"
        | "plumbing"
        | "finishing"
        | "other"
      party_class: "person" | "shop" | "supplier"
      payment_method: "cash" | "bank_transfer" | "upi" | "other"
      transaction_type:
        | "money_in"
        | "transfer"
        | "operational_expense"
        | "general_expense"
        | "supplier_payment"
        | "opening_balance"
      voucher_type:
        | "Receipt"
        | "Payment"
        | "Journal"
        | "Contra"
        | "Purchase"
        | "Sales"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_group: ["Asset", "Liability", "Equity", "Revenue", "Expense"],
      account_type: ["cash", "bank", "upi", "other"],
      material_class: [
        "bulk",
        "hardware",
        "electrical",
        "plumbing",
        "finishing",
        "other",
      ],
      party_class: ["person", "shop", "supplier"],
      payment_method: ["cash", "bank_transfer", "upi", "other"],
      transaction_type: [
        "money_in",
        "transfer",
        "operational_expense",
        "general_expense",
        "supplier_payment",
        "opening_balance",
      ],
      voucher_type: [
        "Receipt",
        "Payment",
        "Journal",
        "Contra",
        "Purchase",
        "Sales",
      ],
    },
  },
} as const
