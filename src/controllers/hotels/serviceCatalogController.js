import serviceCatalogService from "../../services/serviceCatalogService.js";

class ServiceCatalogController {
    async upsertServiceCatalog(req, res, next) {
        try {
            const catalogData = { ...req.body, hotelId: req.params.hotelId };
            const currentUser = req.user;
            const entry = await serviceCatalogService.upsertServiceCatalog(catalogData, currentUser);
            res.status(200).json({ success: true, data: entry });
        } catch (error) {
            next(error);
        }
    }

    async getServiceCatalog(req, res, next) {
        try {
            const { hotelId } = req.params;
            const filters = {
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                category: req.query.category
            };
            const catalog = await serviceCatalogService.getServiceCatalog(hotelId, filters);
            res.status(200).json({ success: true, data: catalog });
        } catch (error) {
            next(error);
        }
    }

    async getServiceByType(req, res, next) {
        try {
            const { hotelId, serviceType } = req.params;
            const entry = await serviceCatalogService.getServiceByType(hotelId, serviceType);
            res.status(200).json({ success: true, data: entry });
        } catch (error) {
            next(error);
        }
    }

    async deleteServiceCatalog(req, res, next) {
        try {
            const { id } = req.params;
            const currentUser = req.user;
            const result = await serviceCatalogService.deleteServiceCatalog(id, currentUser);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

export default new ServiceCatalogController();
