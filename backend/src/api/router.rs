use ntex::web::{self};

pub fn configure(cfg: &mut web::ServiceConfig) {
    crate::api::posts::routes(cfg);
    crate::api::comments::routes(cfg);
    crate::api::reactions::routes(cfg);
    crate::api::search::routes(cfg);
    crate::api::profiles::routes(cfg);
}
