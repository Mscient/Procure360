from typing import Type, Dict
from .base_adapter import BaseAdapter
from .csv_adapter import CSVAdapter
from .kaya_adapter import KayaAdapter
from .gem_adapter import GemAdapter

# The central registry of all available data adapters.
# Adding a new integration means writing the adapter class and adding one line here.
ADAPTER_REGISTRY: Dict[str, Type[BaseAdapter]] = {
    "csv": CSVAdapter,
    "kaya": KayaAdapter,
    "gem": GemAdapter,
}

def get_adapter(source_type: str) -> BaseAdapter:
    """
    Factory function to instantiate the correct adapter.
    """
    adapter_class = ADAPTER_REGISTRY.get(source_type.lower())
    if not adapter_class:
        raise ValueError(f"Unknown integration source type: {source_type}")
    
    return adapter_class()
