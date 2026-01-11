import ServiceCatalog from "../models/ServiceCatalog.js";
import mongoose from "mongoose";

class ServiceCatalogService {
    /**
     * Create or update service catalog entry
     * @param {Object} catalogData - Service catalog data
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Created/Updated service catalog entry
     */
    async upsertServiceCatalog(catalogData, currentUser) {
        // Only admin can manage service catalog
        if (currentUser.role !== "admin") {
            throw new Error("Only admin can manage service catalog");
        }

        const { hotelId, serviceType, displayName, description, fixedPrice, category, isActive } = catalogData;

        // Validate required fields
        if (!hotelId || !serviceType || !displayName) {
            throw new Error("Hotel ID, service type, and display name are required");
        }

        // Validate hotelId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            throw new Error("Invalid hotel ID");
        }

        // Validate fixed price for non-"other" services
        if (serviceType !== "other" && (fixedPrice === undefined || fixedPrice === null)) {
            throw new Error("Fixed price is required for all services except 'other'");
        }

        // Check if service catalog entry already exists
        const existingEntry = await ServiceCatalog.findOne({ hotelId, serviceType });

        if (existingEntry) {
            // Update existing entry
            existingEntry.displayName = displayName;
            existingEntry.description = description || "";
            if (serviceType !== "other") {
                existingEntry.fixedPrice = fixedPrice;
            }
            if (category) {
                existingEntry.category = category;
            }
            if (isActive !== undefined) {
                existingEntry.isActive = isActive;
            }

            await existingEntry.save();
            return existingEntry.toJSON();
        } else {
            // Create new entry
            const newEntry = new ServiceCatalog({
                hotelId,
                serviceType,
                displayName,
                description: description || "",
                fixedPrice: serviceType !== "other" ? fixedPrice : undefined,
                category: category || "other",
                isActive: isActive !== undefined ? isActive : true,
            });

            await newEntry.save();
            return newEntry.toJSON();
        }
    }

    /**
     * Get service catalog for a hotel
     * @param {string} hotelId - Hotel ID
     * @param {Object} filters - Optional filters (isActive, category)
     * @returns {Array} Service catalog entries
     */
    async getServiceCatalog(hotelId, filters = {}) {
        // Validate hotelId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            throw new Error("Invalid hotel ID");
        }

        const query = { hotelId };

        // Apply filters
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters.category) {
            query.category = filters.category;
        }

        const catalogEntries = await ServiceCatalog.find(query).sort({ category: 1, displayName: 1 });

        return catalogEntries.map((entry) => entry.toJSON());
    }

    /**
     * Get service catalog entry by service type
     * @param {string} hotelId - Hotel ID
     * @param {string} serviceType - Service type
     * @returns {Object} Service catalog entry
     */
    async getServiceByType(hotelId, serviceType) {
        // Validate hotelId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            throw new Error("Invalid hotel ID");
        }

        const catalogEntry = await ServiceCatalog.findOne({ hotelId, serviceType });

        if (!catalogEntry) {
            throw new Error("Service not found in catalog");
        }

        return catalogEntry.toJSON();
    }

    /**
     * Delete service catalog entry
     * @param {string} catalogId - Service catalog ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Success message
     */
    async deleteServiceCatalog(catalogId, currentUser) {
        // Only admin can delete service catalog entries
        if (currentUser.role !== "admin") {
            throw new Error("Only admin can delete service catalog entries");
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(catalogId)) {
            throw new Error("Invalid service catalog ID");
        }

        const catalogEntry = await ServiceCatalog.findById(catalogId);
        if (!catalogEntry) {
            throw new Error("Service catalog entry not found");
        }

        await ServiceCatalog.findByIdAndDelete(catalogId);

        return { message: "Service catalog entry deleted successfully" };
    }

    /**
     * Toggle service catalog entry active status
     * @param {string} catalogId - Service catalog ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated service catalog entry
     */
    async toggleActiveStatus(catalogId, currentUser) {
        // Only admin can toggle active status
        if (currentUser.role !== "admin") {
            throw new Error("Only admin can toggle service catalog status");
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(catalogId)) {
            throw new Error("Invalid service catalog ID");
        }

        const catalogEntry = await ServiceCatalog.findById(catalogId);
        if (!catalogEntry) {
            throw new Error("Service catalog entry not found");
        }

        catalogEntry.isActive = !catalogEntry.isActive;
        await catalogEntry.save();

        return catalogEntry.toJSON();
    }
}

export default new ServiceCatalogService();
